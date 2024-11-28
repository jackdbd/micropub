import { requestContext } from '@fastify/request-context'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import Ajv from 'ajv'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import formAutoContent from 'form-auto-content'

import { nowUTC } from '../../../lib/date.js'
import { areSameOrigin } from '../../../lib/fastify-request-predicates/index.js'
import { mf2tTojf2 } from '../../../lib/mf2-to-jf2.js'
import { normalizeJf2 } from '../../../lib/micropub/index.js'
import type {
  ActionType,
  BaseStoreError,
  BaseStoreValue,
  Store,
  UpdatePatch
} from '../../../lib/micropub/index.js'
import { invalidRequest } from '../../../lib/micropub/error-responses.js'

import type { PostRequestBody } from '../request.js'
import {
  storeErrorToMicropubError,
  storeValueToMicropubValue
} from '../store-to-micropub.js'

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
  prefix: string
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
    prefix,
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
          const key = part.fieldname

          if (key.includes('[]')) {
            const k = key.split('[]')[0]
            if (data[k]) {
              data[k].push(part.value)
            } else {
              data[k] = [part.value]
            }
            request.log.debug(
              `${prefix}collected array value ${part.value} in form field ${k}`
            )
          } else {
            data[key] = part.value
            request.log.debug(
              `${prefix}collected value ${part.value} in form field ${key}`
            )
          }
        } else if (part.type === 'file') {
          request.log.debug(
            `${prefix}received file ${part.filename}. Passing the request to the /media endpoint`
          )

          // let response: LightMyRequestResponse | Response
          let location: string | undefined = undefined
          if (areSameOrigin(micropub_endpoint, media_endpoint)) {
            request.log.debug(
              `${prefix}make request to LOCAL media endpoint ${media_endpoint} (inject)`
            )

            // I find this quite clanky to use...
            const form = formAutoContent(
              {
                file: {
                  value: part.file,
                  options: {
                    filename: part.filename,
                    contentType: part.mimetype
                  }
                }
              },
              { forceMultiPart: true }
            )

            const response = await request.server.inject({
              url: media_endpoint,
              method: 'POST',
              headers: {
                ...form.headers,
                authorization: request.headers.authorization
              },
              payload: form.payload
            })

            if (response.headers.location) {
              location = response.headers.location.toString()
            }
          } else {
            request.log.debug(
              `${prefix}make request to REMOTE media endpoint ${media_endpoint} (fetch)`
            )

            const form = formAutoContent(
              {
                file: {
                  value: part.file,
                  options: {
                    filename: part.filename,
                    contentType: part.mimetype
                  }
                }
              },
              { forceMultiPart: true }
            )

            // I am afraid this fetch is not correct
            const response = await fetch(media_endpoint, {
              method: 'POST',
              headers: {
                ...form.headers,
                Authorization: request.headers.authorization!
                // 'Content-Disposition': `form-data; name="${part.fieldname}"; filename="${part.filename}"`,
                // 'Content-Type': 'multipart/form-data'
              },
              body: await part.toBuffer()
            })

            location = response.headers.get('location') || undefined
          }

          request.log.debug(
            `${prefix}file location got from media endpoint: ${location}`
          )

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

          // data.photo = {
          //   alt: 'TODO: where to get the alternate text?',
          //   url: location
          // }
        }
      }
      request_body = data as PostRequestBody
      // request.log.warn(data, '=== DATA ===')
    } else {
      request_body = request.body
    }

    if (!request_body) {
      const error_description = 'Request has no body.'
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'No request body',
        description: 'Micropub endpoint error page'
      })
    }

    // The request body sent by a Micropub client could be a JF2 or a MF2.

    let jf2: Jf2
    if (request_body.items) {
      const { error, value } = await mf2tTojf2({ items: request_body.items })

      if (error) {
        const error_description = error.message
        request.log.error({ request_body }, `${prefix}${error_description}`)

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, body)
      } else {
        // We could end up with an access_token in the request body. It happed
        // to me when I made a request from Quill. But I don't think it's
        // Quill's fault. I think it's due to how the formbody plugin works.
        const { access_token: _, action, h, type: _type, ...rest } = value
        jf2 = {
          ...rest,
          // The default action is to create posts (I couldn't find it in the
          // Micropub specs though).
          action: action || 'create',
          date: nowUTC(),
          // If no type is specified (using `h`), the default type [h-entry]
          // SHOULD be used.
          // https://micropub.spec.indieweb.org/#create
          h: h || 'entry'
        }
      }
    } else {
      const { access_token: _, action, h, type: _type, ...rest } = request_body
      jf2 = {
        ...rest,
        action: action || 'create',
        date: nowUTC(),
        h: h || 'entry'
      }
    }

    // If the Micropub client sent us a urlencoded request, we need to normalize
    // fields like syndicate-to[][0], syndicate-to[][1] into actual arrays.
    jf2 = normalizeJf2(jf2)

    // We store the jf2 object in the request context, so if there is a server
    // error we can access it in the error handler.
    requestContext.set('jf2', jf2)

    // The server MUST respond to successful delete and undelete requests with
    // HTTP 200, 201 or 204. If the undelete operation caused the URL of the
    // post to change, the server MUST respond with HTTP 201 and include the new
    // URL in the HTTP Location header.
    // https://micropub.spec.indieweb.org/#delete
    const action = jf2.action as ActionType
    const url = jf2.url

    if (!store[action]) {
      const { code, body } = request.noActionSupportedResponse(action, {
        include_error_description
      })
      return reply.errorResponse(code, body)
    }

    if (!request.hasScope(action)) {
      const { code, body } = request.noScopeResponse(action, {
        include_error_description
      })
      return reply.errorResponse(code, body)
    }

    if (url) {
      switch (action) {
        case 'delete': {
          const result = await store[action](url)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error, {
              include_error_description
            })
            request.log.error(
              `${prefix}${body.error}: ${body.error_description}`
            )
            return reply.errorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { code, summary, payload } = value
            request.log.info(`${prefix}${summary}`)

            return reply.successResponse(code, {
              title: 'Delete success',
              description: 'Delete success page',
              summary,
              payload
            })
          }
        }

        case 'undelete': {
          const result = await store[action](url)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error, {
              include_error_description
            })
            request.log.error(
              `${prefix}${body.error}: ${body.error_description}`
            )
            return reply.errorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { code, summary, payload } = value
            request.log.info(`${prefix}${summary}`)

            return reply.successResponse(code, {
              title: 'Undelete success',
              description: 'Undelete success page',
              summary,
              payload
            })
          }
        }

        case 'update': {
          const { action: _action, h: _h, type: _type, ...rest } = jf2
          const patch = rest as UpdatePatch
          const result = await store[action](url, patch)

          if (result.error) {
            const { code, body } = storeErrorToMicropubError(result.error, {
              include_error_description
            })
            request.log.error(
              `${prefix}${body.error}: ${body.error_description}`
            )
            return reply.errorResponse(code, body)
          } else {
            const value = storeValueToMicropubValue(result.value)
            const { code, payload, summary } = value
            request.log.info(patch, `${prefix}${summary}`)

            return reply.successResponse(code, {
              title: 'Update success',
              description: 'Update success page',
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
          request.log.error({ action, jf2 }, `${prefix}${error_description}`)

          const { code, body } = invalidRequest({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        }
      }
    }

    // If `url` is undefined, it's because action is 'create' (i.e. we need to
    // create the Micropub post)

    switch (jf2.h) {
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
        const error_description = `Post h=${jf2.h} is not supported by this Micropub server.`
        request.log.error({ action, jf2 }, `${prefix}${error_description}`)

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, body)
      }
    }
  }

  return micropubPost
}
