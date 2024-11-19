import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Ajv from 'ajv'
import stringify from 'fast-safe-stringify'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type {
  H_card,
  H_cite,
  H_entry,
  H_event
} from '../../lib/microformats2/index.js'
import { invalid_request, unauthorized } from './errors.js'
import type { UpdatePatch } from './interfaces.js'
import type { Store } from './store.js'
import { defValidateMicroformats2 } from './mf2.js'
import { syndicate } from './syndication.js'
import {
  base64ToUtf8,
  hEntryToMarkdown,
  markdownToHEntry,
  slugify,
  utf8ToBase64
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

interface Service {
  name: string
  url: string
  photo?: string
}

interface User {
  name: string
  url: string
  photo?: string
}

export interface SyndicateToItem {
  uid: string
  name: string
  service: Service
  user: User
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

interface PostRequestBody {
  action?: 'delete' | 'undelete' | 'update'
  h?: string
  url?: string
}

interface PostRouteGeneric extends RouteGenericInterface {
  Body: PostRequestBody
}

export interface MicropubPostConfig {
  ajv: Ajv
  base_url: string
  store: Store
}

export const defMicropubPost = (config: MicropubPostConfig) => {
  const { ajv, base_url, store } = config

  const { validateH_card, validateH_cite, validateH_entry, validateH_event } =
    defValidateMicroformats2(ajv)

  const micropubPost: RouteHandler<PostRouteGeneric> = async (
    request,
    reply
  ) => {
    if (!request.body) {
      return reply.badRequest('request has no body')
    }

    console.log('=== request.body ===', request.body)

    const { action, url } = request.body

    if (url) {
      switch (action) {
        case 'delete': {
          const path = store.publishedUrlToStoreLocation({ url })
          const result = await store.delete({ path })

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          }

          request.log.info(`deleted ${url}`)

          return reply.code(result.value.status_code).send({
            message: result.value.message
          })
        }

        case 'undelete': {
          const path = store.publishedUrlToStoreLocation({ url, deleted: true })
          const result = await store.undelete({ path })

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
          const path = store.publishedUrlToStoreLocation({ url })

          const result_get = await store.get({ path })

          if (result_get.error) {
            return reply.code(result_get.error.status_code).send({
              error: result_get.error.status_text,
              error_description: result_get.error.message
            })
          }

          const { content: original, sha } = result_get.value.body

          const md_original = base64ToUtf8(original)
          let h_entry = markdownToHEntry(md_original)

          // console.log({
          //   message: 'base64 content => markdown => h_entry',
          //   content: original,
          //   md: md_original,
          //   h_entry
          // })

          const patch = request.body as UpdatePatch

          if (patch.delete) {
            const { [patch.delete]: _, ...keep } = h_entry as any
            request.log.info(`deleted property ${patch.delete}`)
            h_entry = keep as H_entry
          }

          if (patch.add) {
            request.log.info(`added ${JSON.stringify(patch.add)}`)
            h_entry = { ...h_entry, ...patch.add }
          }

          if (patch.replace) {
            request.log.info(`replaced ${JSON.stringify(patch.replace)}`)
            h_entry = { ...h_entry, ...patch.replace }
          }

          const md = hEntryToMarkdown(h_entry)

          const content = utf8ToBase64(md)

          const result = await store.update({
            path,
            content,
            sha
          })

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
          request.log.warn(`action ${action} not supported`)
        }
      }
    }

    // TODO: JSON schema to TypeScript type/interface?
    // https://github.com/bcherny/json-schema-to-typescript

    // If no type is specified, the default type h-entry SHOULD be used.
    // https://micropub.spec.indieweb.org/#create
    const h = request.body.h || 'entry'

    switch (h) {
      case 'card': {
        const valid = validateH_card(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }
        const h_card = request.body as H_card

        const fake_permalink = `${base_url}/fake/card`
        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_card,
          message: 'Request accepted.'
        })
      }

      case 'cite': {
        const valid = validateH_cite(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }
        const h_cite = request.body as any as H_cite

        const fake_permalink = `${base_url}/fake/cite`
        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_cite,
          message: 'Request accepted.'
        })
      }

      case 'entry': {
        const valid = validateH_entry(request.body)
        if (!valid) {
          return reply
            .code(invalid_request.code)
            .send(invalid_request.payload('Invalid h-entry (TODO add details)'))
        }

        const h_entry = request.body as H_entry
        const slug = slugify(h_entry)

        if (h_entry['like-of']) {
          const md = hEntryToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          const result = await store.create({
            path: `likes/${slug}.md`,
            content
          })

          // TODO: syndicate like

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (h_entry['in-reply-to']) {
          const md = hEntryToMarkdown(h_entry)
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

          return reply.code(200).send({
            message: 'TODO implement reply'
          })
        }

        if (h_entry['repost-of']) {
          const md = hEntryToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          const result = await store.create({
            path: `reposts/${slug}.md`,
            content
          })

          // TODO: syndicate repost

          if (result.error) {
            return reply.code(result.error.status_code).send({
              error: result.error.status_text,
              error_description: result.error.message
            })
          } else {
            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        if (h_entry['content']) {
          const md = hEntryToMarkdown(h_entry)
          const content = utf8ToBase64(md)

          // TODO: distinguish between articles and notes

          const result = await store.create({
            path: `notes/${slug}.md`,
            content
          })

          // TODO: use a queue on Fly.io? Cloudflare Queues? Cloud Tasks?
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
            return reply.code(result.value.status_code).send({
              h_entry,
              body: result.value.body,
              message: result.value.message
            })
          }
        }

        // We should return a Location response header if we can't (or don't
        // want to) publish the post right away.
        // https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406
        // reply.header('Location', fake_permalink)

        return reply.code(501).send({
          h_entry,
          message: 'Entry not yet handled explicitly.'
        })
      }

      case 'event': {
        const valid = validateH_event(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }

        const h_event = request.body as H_event

        const fake_permalink = `${base_url}/fake/event`
        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_event,
          message: 'Request accepted.'
        })
      }

      default:
        return reply.notImplemented(`h=${h} not implemented`)
    }

    // TODO: create, update, delete, undelete
    // https://github.com/barryf/vibrancy/tree/master/src/http/post-micropub/micropub

    // const result = await db.query(sql`
    //   UPDATE quotes SET likes = likes + 1 WHERE id=${request.params.id} RETURNING likes
    // `);
  }

  return micropubPost
}

export interface MediaPostConfig {
  bucket_name: string
  s3: S3Client
}

export const defMediaPost = (config: MediaPostConfig) => {
  const { bucket_name, s3 } = config

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      request.log.warn(`request ${request.id} is not a multi-part request`)
      // TODO: read the specs. I'm not sure I should handle non multi-part
      // requests received at the media endpoint.
      return reply.badRequest('request is not multi-part')
    }

    const data = await request.file()
    if (!data) {
      return reply.badRequest('multi-part request has no file')
    }

    const Body = await data.toBuffer()
    const ContentType = data.mimetype

    const object_path = data.filename
    const Key = `media/${object_path}`

    const params = {
      Bucket: bucket_name,
      Key,
      Body,
      ContentType
    }

    try {
      const output = await s3.send(new PutObjectCommand(params))
      const version_id = output.VersionId
      const etag = output.ETag
      // TODO: should I send a Location header?
      // reply.header('Location', `${media_endpoint}/${object_path}`)
      return reply
        .code(201)
        .send({ etag, version_id, message: 'Upload successful!' })
    } catch (error) {
      request.log.error(`Error uploading to R2:`, error)
      return reply
        .status(500)
        .send({ error: `Failed to upload to bucket ${bucket_name}` })
    }
  }

  return mediaPost
}
