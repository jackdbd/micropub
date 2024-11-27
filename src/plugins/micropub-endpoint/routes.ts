import { requestContext } from '@fastify/request-context'
import type { Jf2, Mf2Item } from '@paulrobertlloyd/mf2tojf2'
import Ajv from 'ajv'
import stringify from 'fast-safe-stringify'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import formAutoContent from 'form-auto-content'
import { nowUTC } from '../../lib/date.js'
import {
  areSameOrigin,
  clientAcceptsHtml
} from '../../lib/fastify-request-predicates/index.js'
import { mf2tTojf2 } from '../../lib/mf2-to-jf2.js'
import { Jf2PostType } from '../../lib/microformats2/index.js'
import type {
  ActionType,
  BaseStoreError,
  BaseStoreValue,
  Store,
  UpdatePatch
} from '../../lib/micropub/index.js'
import {
  invalidRequest,
  unauthorized
} from '../../lib/micropub/error-responses.js'
import { NAME } from './constants.js'
import type { PostRequestBody } from './request.js'
import {
  storeErrorToMicropubError,
  storeValueToMicropubValue
} from './store-to-micropub.js'
import type { SyndicateToItem } from './syndication.js'

const PREFIX = `${NAME}/routes `

export interface CallbackConfig {
  client_id: string
  include_error_description: boolean
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
  const {
    client_id,
    include_error_description,
    prefix,
    redirect_uri,
    token_endpoint
  } = config

  const callback: RouteHandler<{ Querystring: AuthQuery }> = async (
    request,
    reply
  ) => {
    // TODO: I think I need to implement indieauth-metadata to receive `iss` in
    // the query string from the authorization endpoint.
    // https://indieauth.spec.indieweb.org/#authorization-response
    const { code } = request.query
    // const { code, me } = request.query

    const state = request.session.get('state')

    if (!state) {
      return reply.view('error.njk', {
        error: `invalid_request`,
        error_description: 'TODO: error description',
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix}extracted state (CSRF token) from secure session`
    )

    if (state !== request.query.state) {
      return reply.view('error.njk', {
        error: `invalid_request`,
        error_description: `state from query string does not match state from session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix}state (CSRF token) from query string matches state from session`
    )

    const code_verifier = request.session.get('code_verifier')

    if (!code_verifier) {
      return reply.view('error.njk', {
        error: `invalid_request`,
        error_description: `code_verifier not found in session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(`${prefix}extracted code_verifier from secure session`)

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
        `${prefix}failed to exchange authorization code for access token`
      )
      return reply.view('error.njk', {
        error: `invalid_request`,
        error_description: `Failed to exchange authorization code for access token`,
        description: 'Token error page',
        title: 'Token error'
      })
    }

    // let payload: string
    try {
      const tokenResponse = await response.json()
      console.log('=== defAuthCallback tokenResponse ===', tokenResponse)
      // payload = stringify(tokenResponse, undefined, 2)
      // payload = stringify(tokenResponse.payload, undefined, 2)
    } catch (err) {
      const error = err as Error
      return reply.view('error.njk', {
        error: `invalid_request`,
        error_description: `TODO: error description`,
        description: 'Error page',
        title: error.name
      })
    }

    const auth = response.headers.get('Authorization')

    if (!auth) {
      const error_description = `missing Authorization header`

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      reply.code(code)

      if (clientAcceptsHtml(request)) {
        return reply.view('error.njk', {
          error: body.error,
          error_description,
          description: 'Auth error page',
          title: 'Auth error'
        })
      } else {
        return reply.send(body)
      }
    }

    request.session.set('jwt', auth)
    request.log.debug(`${prefix}set jwt in secure session`)

    return reply.redirect(token_endpoint)
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
        `${prefix}redirect to /login since jwt is not in secure session`
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
      request.log.debug(`${prefix}redirect to /accepted`)
      const uri = `/accepted?data=${encodeURIComponent(
        stringify({ ...data, location }, undefined, 2)
      )}`
      // return reply.send({ ...data, location })
      return reply.redirect(uri)
    } else {
      request.log.debug(`${prefix}redirect to /created`)
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
        `${PREFIX}redirect to /login since jwt is not in secure session`
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
      return reply.code(200).view('micropub-config.njk', {
        title: 'Micropub config',
        description: 'Configuration for this micropub endpoint.',
        data: stringify(data, undefined, 2)
      })
    } else {
      return reply.code(200).send(data)
    }
  }

  return micropubGet
}

interface PostRouteGeneric extends RouteGenericInterface {
  Body: PostRequestBody
}

export interface MicropubPostConfig<
  StoreError extends BaseStoreError = BaseStoreError,
  StoreValue extends BaseStoreValue = BaseStoreValue
> {
  ajv: Ajv
  include_error_description: boolean
  me: string
  media_endpoint: string
  micropub_endpoint: string
  store: Store<StoreError, StoreValue>
}

// We should return a Location response header if we can't (or don't want to)
// publish the post right away.
// https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406

/**
 * When a user creates an entry (e.g. a note) that contains one or more files
 * (e.g. one photo), different Micropub clients might behave differently.
 * Some Micropub clients might upload the files to the Media endpoint and the
 * other microformats2 fields to the Micropub endpoint.
 * Some other Micropub clients might make a single, multi-part request to just
 * the Micropub endpoint.
 *
 * From the [Quill documentation](https://quill.p3k.io/docs/note).
 * If your Micropub server supports a Media Endpoint, then at the time you
 * select a photo, Quill uploads the file to your Media Endpoint and shows a
 * preview in the interface. The image URL will be sent as a string in the
 * request.
 *
 * If your Micropub server does not support a Media Endpoint, then when you
 * add an image, it is not uploaded until you click "post", and then is sent
 * to your Micropub endpoint as a file.
 *
 * A request containing files and fields coming from an API client like Postman
 * or Bruno will be a single, multi-part request to the Micropub endpoint.
 *
 * From the [Micropub spec](https://micropub.spec.indieweb.org/#posting-files).
 * When a Micropub request includes a file, the entire request is sent in
 * `multipart/form-data encoding`, and the file is named according to the
 * property it corresponds with in the vocabulary, either audio, video or photo.
 *
 * @see https://indieweb.org/Micropub#Handling_a_micropub_request
 */
export const defMicropubPost = <
  StoreError extends BaseStoreError = BaseStoreError,
  StoreValue extends BaseStoreValue = BaseStoreValue
>(
  config: MicropubPostConfig<StoreError, StoreValue>
) => {
  const {
    include_error_description,
    media_endpoint,
    micropub_endpoint,
    store
  } = config

  const micropubPost: RouteHandler<PostRouteGeneric> = async (
    request,
    reply
  ) => {
    let request_body: PostRequestBody
    if (request.isMultipart()) {
      const parts = request.parts()
      const data: Record<string, any> = {}
      for await (const part of parts) {
        if (part.type === 'field') {
          request.log.debug(`${PREFIX}collect form field ${part.fieldname}`)
          data[part.fieldname] = part.value
        } else if (part.type === 'file') {
          request.log.debug(
            `${PREFIX}received file ${part.filename}. Passing the request to the /media endpoint`
          )

          // const buf = await part.toBuffer()

          // I'm not sure I'm passing all the required form fields.
          const form = formAutoContent(
            {
              // This doesn't work
              // fields: { file: part.file, filename: part.filename }

              file: part.file,
              // file: buf,
              filename: part.filename
            },
            { forceMultiPart: true }
          )

          // TODO: only if the media endpoint is on this same server we can
          // inject the request.

          // let response: LightMyRequestResponse | Response

          const response = await request.server.inject({
            url: media_endpoint,
            method: 'POST',
            headers: {
              ...form.headers,
              authorization: request.headers.authorization
            },
            payload: form.payload
          })

          if (areSameOrigin(micropub_endpoint, media_endpoint)) {
            request.log.debug(
              `${PREFIX}make request to local media endpoint ${media_endpoint} (inject)`
            )
          } else {
            request.log.debug(
              `${PREFIX}make request to remote media endpoint ${media_endpoint} (fetch)`
            )
          }

          // This doesn't work. The media endpoint receives a request that has
          // no data. TODO: How should I pass the body?
          // const response = await fetch(media_endpoint, {
          //   method: 'POST',
          //   headers: new Headers({
          //     ...form.headers,
          //     authorization: request.headers.authorization!
          //   }),
          //   body: form.payload as any
          // })

          request.log.debug(
            response.headers,
            `${PREFIX}response headers from media endpoint`
          )

          // console.log('=== response body from media endpoint ===')
          // const response_body = response.json()
          // console.log(response_body)

          // I could create a photos array:
          // 1. collect the photo alt text when part.type === 'field'. Maybe use
          // a field like mp-photo-alt-text? It should match the number of photo
          // files. E.g. set two mp-photo-alt-text[] for two photo files.
          // 2. make a request to the /media endpoint and use
          // response.header.location as the photo url
          // 3. push photo {alt, url} to the photos array
          // 4. set `photos` as `photo` in the `request body`
          // It seems that Quill takes a similar approach.
          // https://github.com/aaronpk/Quill/blob/8ecaed3d2f5a19bf1a5c4cb077658e1bd3bc8438/views/new-post.php#L448

          // data.photo = response.headers.location

          data.photo = {
            alt: 'TODO: where to get the alternate text? Maybe use mp-photo-alt',
            url: response.headers.location
          }
        }
      }
      request_body = data
    } else {
      request_body = request.body
    }

    if (!request_body) {
      const { code, body } = invalidRequest({
        error_description: `request has no body`,
        include_error_description
      })
      request.log.warn(`${PREFIX}${body.error}: ${body.error_description}`)

      return reply.micropubErrorResponse(code, body)
    }

    // Micropub requests from Quill include an access token in the body.
    // I think it's not a Quill issue. I think it's due to the Fastify formbody
    // plugin.
    // Obviously, we don't want the access token to appear in any published
    // content, so we need to remove it.
    const { access_token: _, url, h, ...rest } = request_body

    // I couldn't find it in the Micropub specs, but the default action is 'create'
    const action: ActionType = request_body.action || 'create'

    // If no type is specified, the default type [h-entry] SHOULD be used.
    // https://micropub.spec.indieweb.org/#create

    let jf2: Jf2
    let post_type: Jf2PostType
    if (h) {
      post_type = h
      jf2 = { ...rest, date: nowUTC(), type: post_type } as Jf2
    } else {
      const items = [rest] as Mf2Item[]
      const { error, value } = await mf2tTojf2({ items })

      if (error) {
        const error_description = error.message
        request.log.warn({ request_body }, `${PREFIX}${error_description}`)

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return reply.micropubErrorResponse(code, body)
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

    // The server MUST respond to successful delete and undelete requests with
    // HTTP 200, 201 or 204. If the undelete operation caused the URL of the
    // post to change, the server MUST respond with HTTP 201 and include the new
    // URL in the HTTP Location header.
    // https://micropub.spec.indieweb.org/#delete

    if (!store[action]) {
      const { code, body } = request.noActionSupportedResponse(action, {
        include_error_description
      })
      return reply.micropubErrorResponse(code, body)
    }

    if (!request.hasScope(action)) {
      const { code, body } = request.noScopeResponse(action, {
        include_error_description
      })
      return reply.micropubErrorResponse(code, body)
    }

    if (url) {
      switch (action) {
        case 'delete': {
          const result = await store[action](url)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error)
            request.log.error(
              `${PREFIX}${body.error}: ${body.error_description}`
            )
            return reply.micropubErrorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { summary } = value
            request.log.info(`${PREFIX}${summary}`)
            return reply.micropubDeleteSuccessResponse(summary)
          }
        }

        case 'undelete': {
          const result = await store[action](url)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error)
            request.log.error(
              `${PREFIX}${body.error}: ${body.error_description}`
            )
            return reply.micropubErrorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { code, summary } = value
            request.log.info(`${PREFIX}${summary}`)
            return reply.micropubUndeleteSuccessResponse(code, { summary })
          }
        }

        case 'update': {
          const patch = rest as UpdatePatch
          const result = await store[action](url, patch)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error)
            request.log.error(
              `${PREFIX}${body.error}: ${body.error_description}`
            )
            return reply.micropubErrorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { code, payload, summary } = value
            request.log.info(patch, `${PREFIX}${summary}`)
            return reply.micropubUpdateSuccessResponse(code, {
              summary,
              payload
            })
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
        }

        default: {
          const error_description = `Action '${action}' is not supported by this Micropub server.`
          request.log.warn({ action, jf2 }, `${PREFIX}${error_description}`)

          const { code, body } = invalidRequest({
            error_description,
            include_error_description
          })

          return reply.micropubErrorResponse(code, body)
        }
      }
    }

    // If `url` is undefined, it's because action is 'create' (i.e. we need to
    // create the Micropub post)
    switch (post_type) {
      case 'card': {
        return reply.micropubResponseCard(jf2)
      }

      case 'cite': {
        return reply.micropubResponseCite(jf2)
      }

      case 'event': {
        return reply.micropubResponseEvent(jf2)
      }

      case 'entry': {
        return reply.micropubResponseEntry(jf2)
      }

      default: {
        const error_description = `Post type '${post_type}' is not supported by this Micropub server.`
        request.log.warn({ action, jf2 }, `${PREFIX}${error_description}`)

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return reply.micropubErrorResponse(code, body)
      }
    }
  }

  return micropubPost
}
