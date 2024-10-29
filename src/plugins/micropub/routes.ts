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
import { defValidateMicroformats2 } from './mf2.js'

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
      reply.code(401)
      return reply.view('error.njk', {
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

  const micropubGet: RouteHandler = (_request, reply) => {
    return reply.send({
      'media-endpoint': media_endpoint,
      'syndicate-to': syndicate_to
    })
  }

  return micropubGet
}

interface PostRequestBody {
  h: string
}

interface PostRouteGeneric extends RouteGenericInterface {
  Body: PostRequestBody
}

export interface MicropubPostConfig {
  ajv: Ajv
  base_url: string
  bucket_name: string
  media_endpoint: string
  s3: S3Client
}

export const defMicropubPost = (config: MicropubPostConfig) => {
  const { ajv, base_url, bucket_name, media_endpoint, s3 } = config

  const { validateH_card, validateH_cite, validateH_entry, validateH_event } =
    defValidateMicroformats2(ajv)

  const micropubPost: RouteHandler<PostRouteGeneric> = async (
    request,
    reply
  ) => {
    // const content_disposition = request.headers['content-disposition']
    // if (content_disposition && content_disposition.includes('form-data')) {
    //   const message = `received request with content-disposition: form-data. Isn't a Micropub client supposed to send them only to the media endpoint? What should I do here?`
    //   request.log.warn(message)
    //   return reply.send({ message })
    // }

    if (!request.body) {
      if (request.isMultipart()) {
        request.log.warn(`received multi-part request`)
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
          console.log('=== PutObjectCommand output ===', output)
          reply.header('Location', `${media_endpoint}/${object_path}`)
          return reply
            .code(201)
            .send({ etag, version_id, message: 'Upload successful!' })
        } catch (error) {
          request.log.error(`Error uploading to R2:`, error)
          return reply
            .status(500)
            .send({ error: `Failed to upload to bucket ${bucket_name}` })
        }
      } else {
        return reply.badRequest('request has no body and is not multi-part')
      }
    }

    // TODO: JSON schema to TypeScript type/interface?
    // https://github.com/bcherny/json-schema-to-typescript

    // If no type is specified, the default type h-entry SHOULD be used.
    // https://micropub.spec.indieweb.org/#create
    const h = request.body.h || 'entry'

    let fake_permalink = `${base_url}/fake/foo`

    switch (h) {
      case 'card': {
        const valid = validateH_card(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }
        const h_card = request.body as H_card

        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_card,
          message: 'Request accepted. Starting to process task.',
          taskId: '123',
          monitorUrl: 'http://example.com/tasks/123/status'
        })
      }

      case 'cite': {
        const valid = validateH_cite(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }
        const h_cite = request.body as any as H_cite

        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_cite,
          message: 'Request accepted. Starting to process task.',
          taskId: '123',
          monitorUrl: 'http://example.com/tasks/123/status'
        })
      }

      case 'entry': {
        const valid = validateH_entry(request.body)
        if (!valid) {
          return reply.code(400).send({
            error: 'invalid_request',
            error_description: 'Invalid h-entry (TODO add details)'
          })
          // return reply.badRequest('invalid_request')
        }
        const h_entry = request.body as H_entry

        if (h_entry['content']) {
          fake_permalink = `${base_url}/notes/foo`
        }

        if (h_entry['like-of']) {
          fake_permalink = `${base_url}/likes/foo`
        }

        if (h_entry['in-reply-to']) {
          fake_permalink = `${base_url}/replies/foo`
        }

        if (h_entry['repost-of']) {
          fake_permalink = `${base_url}/reposts/foo`
        }

        // We should return a Location response header if we can't (or don't
        // want to) publish the post right away.
        // https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406
        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_entry,
          message: 'Request accepted. Starting to process task.',
          taskId: '123',
          monitorUrl: 'http://example.com/tasks/123/status'
        })
      }

      case 'event': {
        const valid = validateH_event(request.body)
        if (!valid) {
          return reply.badRequest('invalid_request')
        }

        const h_event = request.body as H_event

        reply.header('Location', fake_permalink)

        return reply.code(202).send({
          h_event,
          message: 'Request accepted. Starting to process task.',
          taskId: '123',
          monitorUrl: 'http://example.com/tasks/123/status'
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
