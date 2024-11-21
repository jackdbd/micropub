import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { requestContext } from '@fastify/request-context'
import type { Jf2, Mf2Item } from '@paulrobertlloyd/mf2tojf2'
import Ajv from 'ajv'
import stringify from 'fast-safe-stringify'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import formAutoContent from 'form-auto-content'
import { nowUTC } from '../../lib/date.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'
import { mf2tTojf2 } from '../../lib/mf2-to-jf2.js'
import { Jf2PostType } from '../../lib/microformats2/index.js'
import { slugify } from '../../lib/slugify.js'
import { defActions, type UpdatePatch } from './actions.js'
import { NAME } from './constants.js'
import { unauthorized, mpError } from './errors.js'
import type { Store } from './store.js'
import { syndicate, type SyndicateToItem } from './syndication.js'
import type { PostRequestBody } from './request.js'
import { defValidateJf2 } from './validate-jf2.js'

const PREFIX = `${NAME}/routes`

export interface CallbackConfig {
  client_id: string
  prefix: string
  redirect_uri: string
  token_endpoint: string
}

// https://indieauth.spec.indieweb.org/#authorization-response
interface AuthQuery {
  code: string
  iss: string
  me: string
  state: string
}

// TODO: replace fetch with request.server.inject for local requests (maybe do
// this when the app gets instantiated)

export const defAuthCallback = (config: CallbackConfig) => {
  const { client_id, prefix, redirect_uri, token_endpoint } = config

  const callback: RouteHandler<{ Querystring: AuthQuery }> = async (
    request,
    reply
  ) => {
    // TODO: I think I need to implement indieauth-metadata to receive `iss` in
    // the query string from the authorization endpoint.
    // https://indieauth.spec.indieweb.org/#authorization-response
    const { code, me } = request.query

    const state = request.session.get('state')

    if (!state) {
      return reply.view('error.njk', {
        message: `state not found in session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix} extracted state (CSRF token) from secure session`
    )

    if (state !== request.query.state) {
      return reply.view('error.njk', {
        message: `state from query string does not match state from session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix} state (CSRF token) from query string matches state from session`
    )

    const code_verifier = request.session.get('code_verifier')

    if (!code_verifier) {
      return reply.view('error.njk', {
        message: `code_verifier not found in session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(`${prefix} extracted code_verifier from secure session`)

    ////////////////////////////////////////////////////////////////////////////
    // This is for testing/demoing the token exchange.
    // return reply.view('auth-success.njk', {
    //   code,
    //   code_verifier,
    //   description: 'Auth success page',
    //   me,
    //   redirect_uri,
    //   title: 'Auth success',
    //   token_endpoint
    // })
    ////////////////////////////////////////////////////////////////////////////

    // After the IndieAuth client validates the state parameter, the client
    // makes a POST request to the token endpoint to exchange the authorization
    // code for an access token.

    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code,
        code_verifier,
        grant_type: 'authorization_code',
        redirect_uri
      })
    })

    if (!response.ok) {
      request.log.error(
        `${prefix} failed to exchange authorization code for access token`
      )
      return reply.view('error.njk', {
        message: `Failed to exchange authorization code for access token`,
        description: 'Token error page',
        title: 'Token error'
      })
    }

    let payload: string
    try {
      const tokenResponse = await response.json()
      // payload = stringify(tokenResponse, undefined, 2)
      payload = stringify(tokenResponse.payload, undefined, 2)
    } catch (err) {
      const error = err as Error
      return reply.view('error.njk', {
        description: 'Error page',
        title: error.name,
        message: error.message
      })
    }

    const auth = response.headers.get('Authorization')

    if (!auth) {
      return reply.code(unauthorized.code).view('error.njk', {
        message: `missing Authorization header`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.session.set('jwt', auth)
    request.log.debug(`${prefix} set jwt in secure session`)
    // TODO: redirect to /editor?

    return reply.view('token.njk', {
      description: 'Token page',
      title: 'Token',
      me,
      payload
    })
  }

  return callback
}

export interface SubmitConfig {
  micropub_endpoint: string
  prefix: string
}

export const defSubmit = (config: SubmitConfig) => {
  const { micropub_endpoint, prefix } = config

  const submit: RouteHandler = async (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      request.log.debug(
        `${prefix} redirect to /login since jwt is not in secure session`
      )
      return reply.redirect('/login')
    }

    const response = await fetch(micropub_endpoint, {
      method: 'POST',
      body: stringify(request.body),
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (response.status === 202) {
      const location = response.headers.get('Location')
      request.log.debug(`${prefix} redirect to /accepted`)
      const uri = `/accepted?data=${encodeURIComponent(
        stringify({ ...data, location }, undefined, 2)
      )}`
      // return reply.send({ ...data, location })
      return reply.redirect(uri)
    } else {
      request.log.debug(`${prefix} redirect to /created`)
      // return reply.send(data)
      const uri = `/created?data=${encodeURIComponent(
        stringify(data, undefined, 2)
      )}`
      return reply.redirect(uri)
    }
  }

  return submit
}

export const postAccepted: RouteHandler = (request, reply) => {
  return reply.view('post-accepted.njk', {
    description: 'Post accepted page',
    title: 'Post accepted',
    data: (request.query as any).data
  })
}

export const postCreated: RouteHandler = (request, reply) => {
  return reply.view('post-created.njk', {
    description: 'Post created page',
    title: 'Post created',
    data: (request.query as any).data
  })
}

export interface EditorConfig {
  submit_endpoint: string
}

export const defEditor = (config: EditorConfig) => {
  const { submit_endpoint } = config

  const editor: RouteHandler = (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      request.log.debug(
        `${PREFIX} redirect to /login since jwt is not in secure session`
      )
      return reply.redirect('/login')
    }

    return reply.view('editor.njk', {
      description: 'Editor page',
      submit_endpoint,
      title: 'Editor'
    })
  }

  return editor
}

export interface MicropubGetConfig {
  media_endpoint: string
  syndicate_to: SyndicateToItem[]
}

/**
 * https://micropub.spec.indieweb.org/#configuration
 */
export const defMicropubGet = (config: MicropubGetConfig) => {
  const { media_endpoint, syndicate_to } = config

  const micropubGet: RouteHandler = (request, reply) => {
    const data = {
      'media-endpoint': media_endpoint,
      'syndicate-to': syndicate_to
    }

    if (clientAcceptsHtml(request)) {
      return reply.view('micropub-config.njk', {
        description: 'Configuration for this micropub endpoint.',
        title: 'Micropub config',
        data: stringify(data, undefined, 2)
      })
    } else {
      return reply.send(data)
    }
  }

  return micropubGet
}

interface PostRouteGeneric extends RouteGenericInterface {
  Body: PostRequestBody
}

export interface MicropubPostConfig {
  ajv: Ajv
  me: string
  store: Store
}

// We should return a Location response header if we can't (or don't want to)
// publish the post right away.
// https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406

export const defMicropubPost = (config: MicropubPostConfig) => {
  const { ajv, me, store } = config

  const { validateCard, validateCite, validateEntry, validateEvent } =
    defValidateJf2(ajv)

  const actions = defActions({ store })

  const micropubPost: RouteHandler<PostRouteGeneric> = async (
    request,
    reply
  ) => {
    request.log.debug(
      `${PREFIX} content-type: ${request.headers['content-type']}`
    )

    let request_body: PostRequestBody
    if (request.isMultipart()) {
      const parts = request.parts()
      const data: Record<string, any> = {}
      for await (const part of parts) {
        if (part.type === 'field') {
          console.log(`=== collect form field ${part.fieldname} ===`)
          data[part.fieldname] = part.value
        } else if (part.type === 'file') {
          // TODO: do I really need to consume the buffer here? Why? Explain.
          console.log(`=== Received file: ${part.filename} ===`)
          console.log(`=== Passing the request to the /media endpoint ===`)

          // const buf = await part.toBuffer()
          // console.log(`=== Buffer length: ${buf.length} ===`)

          // https://micropub.spec.indieweb.org/#posting-files
          const form = formAutoContent(
            {
              // I tried this, but it doesn't work
              // fields: { file: part.file, filename: part.filename }
              file: part.file,
              name: part.filename
            },
            { forceMultiPart: true }
          )

          const response = await request.server.inject({
            method: 'POST',
            url: '/media',
            headers: {
              ...form.headers,
              authorization: request.headers.authorization
            },
            payload: form.payload
          })

          // console.log('=== response headers from media endpoint ===')
          // console.log(response.headers)

          // console.log('=== response body from media endpoint ===')
          // const response_body = response.json()
          // console.log(response_body)

          // data.photo = response.headers.location

          data.photo = {
            alt: 'todo: where to get the alternate text?',
            url: response.headers.location
          }
        }
      }
      request_body = data
    } else {
      request_body = request.body
    }

    if (!request_body) {
      return reply.micropubInvalidRequest('request has no body')
    }

    // Micropub requests from Quill include an access token in the body.
    // I think it's not a Quill issue. I think it's due to the Fastify formbody
    // plugin.
    // Obviously, we don't want the access token to appear in any published
    // content, so we need to remove it.
    const { access_token: _, action, url, h, ...rest } = request_body

    let jf2: Jf2
    let post_type: Jf2PostType
    if (h) {
      post_type = h
      jf2 = { ...rest, date: nowUTC() } as Jf2
    } else {
      const items = [rest] as Mf2Item[]
      const { error, value } = await mf2tTojf2({ items })

      if (error) {
        request.log.warn({ request_body }, error.message)
        return reply.micropubInvalidRequest(error.message)
      } else {
        jf2 = { ...value, date: nowUTC() }
        post_type = jf2.type
      }
    }

    // console.log('=== jf2 (JSON stringified) ===')
    // console.log(stringify(jf2, undefined, 2))

    // We store the jf2 object in the request context, so if there is a server
    // error we can access it in the error handler.
    requestContext.set('jf2', jf2)

    // TODO: should actions be syndicated?

    if (url && action) {
      switch (action) {
        case 'delete': {
          const result = await actions.delete(url)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          }

          request.log.info(`${PREFIX} deleted ${url}`)
          const { status_code, message } = result.value
          return reply.code(status_code).send({ message })
        }

        case 'undelete': {
          const result = await actions.undelete(url)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          }

          // The server MUST respond to successful delete and undelete requests
          // with HTTP 200, 201 or 204. If the undelete operation caused the URL of the post to change, the server MUST
          // respond with HTTP 201 and include the new URL in the HTTP Location
          // header.
          // https://micropub.spec.indieweb.org/#delete

          request.log.info(`${PREFIX} undeleted ${url}`)
          const { status_code, message } = result.value
          return reply.code(status_code).send({ message })
        }

        case 'update': {
          // Updating entries is done by sending an HTTP POST with a JSON payload describing the changes to make.
          // https://micropub.spec.indieweb.org/#update-p-2
          // https://micropub.spec.indieweb.org/#update-p-3
          const patch = rest as UpdatePatch
          const result = await actions.update(url, patch)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          }

          // TODO: return correct response upon successful update operation
          // https://micropub.spec.indieweb.org/#response-0-p-1
          // The server MUST respond to successful update requests with HTTP 200,
          // 201 or 204.
          // If the update operation caused the URL of the post to change, the
          // server MUST respond with HTTP 201 and include the new URL in the
          // HTTP Location header. Otherwise, the server MUST respond with 200
          // or 204, depending on whether the response body has content.
          // No body is required in the response, but the response MAY contain a
          // JSON object describing the changes that were made.

          request.log.info(`${PREFIX} updated ${url}`)
          const { status_code, message } = result.value
          return reply.code(status_code).send({
            message,
            body: result.value.body
          })
        }

        default: {
          const message = `action '${action}' is not supported by this Micropub server`
          request.log.warn({ action }, message)
          return reply.micropubInvalidRequest(message)
        }
      }
    }

    // TODO: JSON schema to TypeScript type/interface?
    // https://github.com/bcherny/json-schema-to-typescript

    switch (post_type) {
      case 'card': {
        const valid = validateCard(jf2)
        if (!valid) {
          const message = 'invalid JF2 card'
          request.log.warn({ jf2, errors: validateCard.errors || [] }, message)
          return reply.micropubInvalidRequest(message)
        }

        const slug = slugify(jf2)
        const content = store.jf2ToContent(jf2)
        const { type: _, ...card } = jf2

        const result = await store.create({
          path: `cards/${slug}.md`,
          content
        })

        if (result.error) {
          const { code, error, error_description } = mpError(result.error)
          request.log.error(error_description)
          return reply.code(code).send({ error, error_description })
        } else {
          // TODO: syndicate card
          const messages = await syndicate(card as any)
          console.log('=== syndication ===')
          console.log(messages)

          reply.header('Location', me)

          return reply.code(result.value.status_code).send({
            card,
            body: result.value.body,
            message: result.value.message
          })
        }
      }

      case 'cite': {
        const valid = validateCite(jf2)
        if (!valid) {
          const message = 'invalid JF2 cite'
          request.log.warn({ jf2, errors: validateCite.errors || [] }, message)
          return reply.micropubInvalidRequest(message)
        }

        const slug = slugify(jf2)
        const content = store.jf2ToContent(jf2)
        const { type: _, ...cite } = jf2

        const result = await store.create({
          path: `quotes/${slug}.md`,
          content
        })

        if (result.error) {
          const { code, error, error_description } = mpError(result.error)
          request.log.error(error_description)
          return reply.code(code).send({ error, error_description })
        } else {
          // TODO: syndicate cite
          const messages = await syndicate(cite as any)
          console.log('=== syndication ===')
          console.log(messages)

          reply.header('Location', me)

          return reply.code(result.value.status_code).send({
            cite,
            body: result.value.body,
            message: result.value.message
          })
        }
      }

      case 'entry': {
        const valid = validateEntry(jf2)
        if (!valid) {
          const message = 'invalid JF2 entry'
          request.log.warn({ jf2, errors: validateEntry.errors || [] }, message)
          return reply.micropubInvalidRequest(message)
        }

        const slug = slugify(jf2)
        const content = store.jf2ToContent(jf2)
        const { type: _, ...entry } = jf2

        if (entry['bookmark-of']) {
          const result = await store.create({
            path: `bookmarks/${slug}.md`,
            content
          })

          // TODO: syndicate bookmark
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (entry['like-of']) {
          const result = await store.create({
            path: `likes/${slug}.md`,
            content
          })

          // TODO: syndicate like
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        // TODO: test that this works
        if (entry['in-reply-to']) {
          const result = await store.create({
            path: `replies/${slug}.md`,
            content
          })

          // TODO: syndicate in-reply-to
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        // An app that sends read-of entries is indiebookclub.biz
        // https://indieweb.org/indiebookclub
        if (entry['read-of']) {
          const result = await store.create({
            path: `reads/${slug}.md`,
            content
          })

          // TODO: syndicate read
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (entry['repost-of']) {
          const result = await store.create({
            path: `reposts/${slug}.md`,
            content
          })

          // TODO: syndicate repost
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (entry['content']) {
          // TODO: distinguish between articles and notes

          const result = await store.create({
            path: `notes/${slug}.md`,
            content
          })

          // TODO: syndicate article or note
          // Use a queue on Fly.io? Cloudflare Queues? Cloud Tasks?
          // https://fly.io/docs/laravel/the-basics/cron-and-queues/#queue-worker
          const messages = await syndicate(entry as any)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            const { code, error, error_description } = mpError(result.error)
            request.log.error(error_description)
            return reply.code(code).send({ error, error_description })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        const message = `Entry not supported by this Micropub server`
        request.log.warn({ entry }, message)
        return reply.micropubInvalidRequest(message)
      }

      case 'event': {
        const valid = validateEvent(jf2)
        if (!valid) {
          const message = 'invalid JF2 event'
          request.log.warn({ jf2, errors: validateEvent.errors || [] }, message)
          return reply.micropubInvalidRequest(message)
        }

        const slug = slugify(jf2)
        const content = store.jf2ToContent(jf2)
        const { type: _, ...event } = jf2

        const result = await store.create({
          path: `events/${slug}.md`,
          content
        })

        // TODO: syndicate event
        const messages = await syndicate({ ...jf2, 'mp-slug': slug })
        console.log('=== syndication ===')
        console.log(messages)

        if (result.error) {
          const { code, error, error_description } = mpError(result.error)
          request.log.error(error_description)
          return reply.code(code).send({ error, error_description })
        } else {
          reply.header('Location', me)

          return reply.code(result.value.status_code).send({
            event,
            body: result.value.body,
            message: result.value.message
          })
        }
      }

      default: {
        const message = `h=${post_type} not supported by this Micropub server`
        request.log.warn({ jf2 }, message)
        return reply.micropubInvalidRequest(message)
      }
    }
  }

  return micropubPost
}

export interface MediaPostConfig {
  base_url: string
  bucket_name: string
  s3: S3Client
}

/**
 * The role of the Media Endpoint is exclusively to handle file uploads and
 * return a URL that can be used in a subsequent Micropub request.
 *
 * To upload a file to the Media Endpoint, the client sends a multipart/form-data
 * request with one part named file.
 *
 * @see https://micropub.spec.indieweb.org/#media-endpoint
 */
export const defMediaPost = (config: MediaPostConfig) => {
  const { base_url, bucket_name, s3 } = config

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      // To upload a file to the Media Endpoint, the client sends a
      // multipart/form-data request with one part named file.
      // https://micropub.spec.indieweb.org/#request
      const message =
        'request is not multi-part (TIP: use Content-Type: multipart/form-data to make requests to the media endpoint)'
      request.log.warn(
        `${PREFIX} request ${request.id} is not a multi-part request`
      )
      return reply.micropubInvalidRequest(message)
    }

    const data = await request.file()
    if (!data) {
      request.log.warn(
        `${PREFIX} request ${request.id} is multi-part but has no file`
      )
      return reply.micropubInvalidRequest('multi-part request has no file')
    }

    let filename = 'unknown.xyz'
    if (data.filename) {
      filename = data.filename
    } else if (data.fields.name) {
      filename = (data.fields.name as any).value
    }

    const Body = await data.toBuffer()
    const ContentType = data.mimetype

    const bucket_path = `media/${filename}`

    const params = {
      Bucket: bucket_name,
      Key: bucket_path,
      Body,
      ContentType
    }

    // https://www.w3.org/TR/micropub/#response-3
    // The Media Endpoint processes the file upload, storing it in whatever
    // backend it wishes, and generates a URL to the file.
    // The URL SHOULD be unguessable, such as using a UUID in the path.
    // If the request is successful, the endpoint MUST return the URL to the file that was created in the HTTP Location
    // header, and respond with HTTP 201 Created.
    // The response body is left undefined.

    const public_url = `${base_url}${bucket_path}`

    try {
      const output = await s3.send(new PutObjectCommand(params))
      // const etag = output.ETag
      // const metadata = output.$metadata
      // const version_id = output.VersionId

      const message = `file uploaded to R2 bucket ${bucket_name} at path ${bucket_path} and publicly available at ${public_url}`
      request.log.info({ output }, message)

      reply.header('Location', public_url)

      return reply.code(201).send({ message })
    } catch (error) {
      request.log.error(`${PREFIX} error uploading to R2:`, error)
      return reply
        .status(500)
        .send({ error: `Failed to upload to bucket ${bucket_name}` })
    }
  }

  return mediaPost
}
