import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Ajv from 'ajv'
import stringify from 'fast-safe-stringify'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type { H_card, H_cite, H_entry } from '../../lib/microformats2/index.js'
import { defActions, type UpdatePatch } from './actions.js'
import { invalid_request, unauthorized } from './errors.js'
import { eventMf2JsonToObj } from './mf2json.js'
import type { Store } from './store.js'
import { defValidateMicroformats2 } from './mf2.js'
import { syndicate, type SyndicateToItem } from './syndication.js'
import {
  mf2ToMarkdown,
  postType,
  slugify,
  slugifyEvent,
  utf8ToBase64,
  type PostRequestBody
} from './utils.js'

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
      request.log.debug(`redirect to /login since jwt is not in secure session`)
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

    const accept = request.headers.accept

    if (accept && accept.includes('text/html')) {
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

  const { validateH_card, validateH_cite, validateH_entry } =
    defValidateMicroformats2(ajv)

  const actions = defActions({ store })

  const micropubPost: RouteHandler<PostRouteGeneric> = async (
    request,
    reply
  ) => {
    console.log('=== POST /micropub troubleshooting ===')

    console.log('=== request.id ===')
    console.log(request.id)

    // console.log('=== request.url ===')
    // console.log(request.url)

    // console.log('=== request.body ===')
    // console.log(request.body)

    // console.log('=== request.query ===')
    // console.log(request.query)

    console.log('=== request.headers ===')
    console.log(request.headers)

    let request_body: PostRequestBody
    if (request.isMultipart()) {
      //  const multi_part_file = await request.file()
      const parts = request.parts()
      const data: Record<string, any> = {}
      for await (const part of parts) {
        if (part.type === 'field') {
          console.log(`=== collect form field ${part.fieldname} ===`)
          data[part.fieldname] = part.value
        } else if (part.type === 'file') {
          // Handle file uploads
          console.log(`=== Received file: ${part.filename} ===`)
          // console.log(`=== encoding ${part.encoding} ===`)
          // console.log(`=== mimetype ${part.mimetype} ===`)
          const buf = await part.toBuffer()
          console.log(`=== Buffer length: ${buf.length} ===`)
          // const response = await request.server.inject({
          //   method: 'POST',
          //   url: '/media',
          //   payload: part.file,
          //   headers: request.headers
          // })

          // console.log('=== response body from media endpoint ===')
          // const response_body = response.json()
          // console.log(response_body)

          // // Process the file stream or save it
          // return reply.code(response.statusCode).send({
          //   ...response_body,
          //   recap_message: 'response from media endpoint'
          // })
        }
      }
      request_body = data
    } else {
      request_body = request.body
    }

    console.log('=== request_body ===')
    console.log(request_body)

    // if (!request_body) {
    //   return reply.badRequest('request has no body')
    // }

    // Micropub requests from Quill include an access token in the body. I'm not
    // sure it's my fault or it's a Quill issue. Obviously, we don't want the
    // access token to appear in any published content, so we need to remove it.
    const { access_token: _, action, url, h, ...rest } = request_body

    // TODO: should actions be syndicated?

    if (url && action) {
      switch (action) {
        case 'delete': {
          const result = await actions.delete(url)

          if (result.error) {
            const { status_code, status_text, message } = result.error
            return reply.code(status_code).send({
              error: status_text,
              error_description: message
            })
          }

          request.log.info(`deleted ${url}`)

          const { status_code, message } = result.value
          return reply.code(status_code).send({ message })
        }

        case 'undelete': {
          const result = await actions.undelete(url)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          }

          request.log.info(`undeleted ${url}`)

          return reply.code(result.value.status_code).send({
            message: result.value.message
          })
        }

        case 'update': {
          // Updating entries is done by sending an HTTP POST with a JSON payload describing the changes to make.
          // https://micropub.spec.indieweb.org/#update-p-2
          // https://micropub.spec.indieweb.org/#update-p-3
          const patch = rest as UpdatePatch
          const result = await actions.update(url, patch)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          }

          request.log.info(`updated ${url}`)

          return reply.code(result.value.status_code).send({
            message: result.value.message,
            body: result.value.body
          })
        }

        default: {
          const message = `action ${action} is not supported by this Micropub server`
          request.log.warn({ action }, message)
          return reply.notImplemented(message)
        }
      }
    }

    // TODO: JSON schema to TypeScript type/interface?
    // https://github.com/bcherny/json-schema-to-typescript

    const post_type = postType(request_body)

    switch (post_type) {
      case 'card': {
        const valid = validateH_card(rest)
        if (!valid) {
          request.log.warn(
            { body: rest, errors: validateH_card.errors || [] },
            'received invalid h-card'
          )
          return reply.badRequest('invalid_request')
        }

        const h_card = rest as H_card

        reply.header('Location', me)

        return reply.code(202).send({
          h_card,
          message: 'Request accepted.'
        })
      }

      case 'cite': {
        const valid = validateH_cite(rest)
        if (!valid) {
          request.log.warn(
            { body: rest, errors: validateH_cite.errors || [] },
            'received invalid h-cite'
          )
          return reply.badRequest('invalid_request')
        }

        const h_cite = rest as H_cite
        const slug = slugify(h_cite)

        const md = mf2ToMarkdown(h_cite)
        const content = utf8ToBase64(md)

        const result = await store.create({
          path: `quotes/${slug}.md`,
          content
        })

        if (result.error) {
          return reply.code(result.error.status_code).send({
            error: result.error.status_text,
            error_description: result.error.message
          })
        } else {
          // TODO: syndicate cite
          const messages = await syndicate(h_cite)
          console.log('=== syndication ===')
          console.log(messages)

          reply.header('Location', me)

          return reply.code(result.value.status_code).send({
            h_cite,
            body: result.value.body,
            message: result.value.message
          })
        }
      }

      case 'entry': {
        const valid = validateH_entry(rest)
        if (!valid) {
          request.log.warn(
            { body: rest, errors: validateH_entry.errors || [] },
            'received invalid h-entry'
          )
          return reply
            .code(invalid_request.code)
            .send(invalid_request.payload('Invalid h-entry (TODO add details)'))
        }

        const h_entry = rest as H_entry
        const slug = slugify(h_entry)

        if (h_entry['bookmark-of']) {
          const md = mf2ToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          const result = await store.create({
            path: `bookmarks/${slug}.md`,
            content
          })

          // TODO: syndicate bookmark
          const messages = await syndicate(h_entry)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (h_entry['like-of']) {
          const md = mf2ToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          const result = await store.create({
            path: `likes/${slug}.md`,
            content
          })

          // TODO: syndicate like
          const messages = await syndicate(h_entry)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (h_entry['in-reply-to']) {
          const md = mf2ToMarkdown(h_entry)
          console.log('=== TODO: store reply ==')
          console.log(md)
          // const content = utf8ToBase64(md)

          // const result = await store.create({
          //   path: `replies/${slug}.md`,
          //   content
          // })

          const messages = await syndicate(h_entry)
          console.log('=== syndication ===')
          console.log(messages)

          reply.header('Location', me)

          return reply.code(200).send({
            message: 'TODO implement reply'
          })
        }

        if (h_entry['repost-of']) {
          const md = mf2ToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          const result = await store.create({
            path: `reposts/${slug}.md`,
            content
          })

          // TODO: syndicate repost
          const messages = await syndicate(h_entry)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (h_entry['content']) {
          const md = mf2ToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          // TODO: distinguish between articles and notes

          const result = await store.create({
            path: `notes/${slug}.md`,
            content
          })

          // TODO: syndicate article or note
          // Use a queue on Fly.io? Cloudflare Queues? Cloud Tasks?
          // https://fly.io/docs/laravel/the-basics/cron-and-queues/#queue-worker
          const messages = await syndicate(h_entry)
          console.log('=== syndication ===')
          console.log(messages)

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            reply.header('Location', me)

            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        const message = 'Entry not yet handled explicitly.'
        request.log.warn({ h_entry }, message)
        return reply.notImplemented(message)
      }

      case 'event': {
        // const valid = validateH_event(rest)
        // if (!valid) {
        //   request.log.warn(
        //     { body: rest, errors: validateH_event.errors || [] },
        //     'received invalid h-event'
        //   )
        //   return reply.badRequest('invalid_request')
        // }

        const h_event = eventMf2JsonToObj((rest as any).properties)
        const slug = slugifyEvent(h_event)
        const md = mf2ToMarkdown(h_event)
        const content = utf8ToBase64(md)

        const result = await store.create({
          path: `events/${slug}.md`,
          content
        })

        // TODO: syndicate event
        const messages = await syndicate(h_event)
        console.log('=== syndication ===')
        console.log(messages)

        if (result.error) {
          return reply.code(result.error.status_code).send({
            error: result.error.status_text,
            error_description: result.error.message
          })
        } else {
          reply.header('Location', me)

          return reply.code(result.value.status_code).send({
            h_event,
            body: result.value.body,
            message: result.value.message
          })
        }
      }

      default: {
        const message = `h=${post_type} not supported by this Micropub server`
        request.log.warn({ post_type }, message)
        return reply.notImplemented(message)
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

export const defMediaPost = (config: MediaPostConfig) => {
  const { base_url, bucket_name, s3 } = config

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      request.log.warn(`request ${request.id} is not a multi-part request`)
      // TODO: read the specs. I'm not sure I should handle non multi-part
      // requests received at the media endpoint.
      return reply.badRequest('request is not multi-part')
    }

    console.log('=== POST /media troubleshooting ===')

    console.log('=== request.id ===')
    console.log(request.id)

    console.log('=== request.url ===')
    console.log(request.url)

    console.log('=== request.params ===')
    console.log(request.params)

    console.log('=== request.query ===')
    console.log(request.query)

    console.log('=== request.headers ===')
    console.log(request.headers)

    const data = await request.file()
    if (!data) {
      return reply.badRequest('multi-part request has no file')
    }

    const Body = await data.toBuffer()
    const ContentType = data.mimetype

    const bucket_path = `media/${data.filename}`

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
      request.log.error(`Error uploading to R2:`, error)
      return reply
        .status(500)
        .send({ error: `Failed to upload to bucket ${bucket_name}` })
    }
  }

  return mediaPost
}
