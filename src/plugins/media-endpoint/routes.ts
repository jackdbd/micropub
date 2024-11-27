import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import type { RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'
import { defErrorIfActionNotAllowed } from '../../lib/error-if-action-not-allowed.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'
import { errorIfMethodNotImplementedInStore } from '../../lib/micropub/index.js'
import type {
  ActionType,
  BaseMediaStoreError,
  BaseMediaStoreValue,
  MediaStore
} from '../../lib/micropub/index.js'
import { invalidRequest } from '../../lib/micropub/error-responses.js'
import { NAME } from './constants.js'

const PREFIX = `${NAME}/routes `

export interface MediaPostConfig<
  E extends BaseMediaStoreError = BaseMediaStoreError,
  V extends BaseMediaStoreValue = BaseMediaStoreValue
> {
  include_error_description: boolean
  store: MediaStore<E, V>
}

/**
 * The role of the Media Endpoint is exclusively to handle file uploads and
 * return a URL that can be used in a subsequent Micropub request.
 *
 * To upload a file to the Media Endpoint, the client sends a
 * `multipart/form-data` request with one part named `file`.
 *
 * The Media Endpoint processes the file upload, storing it in whatever backend
 * it wishes, and generates a URL to the file. The URL SHOULD be unguessable,
 * such as using a UUID in the path.
 * If the request is successful, the endpoint MUST return the URL to the file
 * that was created in the HTTP Location header, and respond with HTTP 201
 * Created. The response body is left undefined.
 *
 * @see https://micropub.spec.indieweb.org/#media-endpoint
 * @see https://micropub.spec.indieweb.org/#request
 * @see https://www.w3.org/TR/micropub/#response-3
 * @see https://micropub.spec.indieweb.org/#uploading-files
 */
export const defMediaPost = (config: MediaPostConfig) => {
  const { include_error_description, store } = config

  const errorIfActionNotAllowed = defErrorIfActionNotAllowed({
    include_error_description,
    log_prefix: 'POST media/'
  })

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      const action = (request.body as any).action as ActionType

      if (action !== 'delete') {
        const { code, body } = invalidRequest({
          error_description: `action '${action}' is not supported by this media endpoint`,
          include_error_description
        })
        return reply.errorResponse(code, body)
      }

      const store_error = errorIfMethodNotImplementedInStore(store, action)
      if (store_error) {
        const { code, body } = store_error
        return reply.errorResponse(code, body)
      }

      // We should also check the presence of a 'media' scope in the access token
      // claims. But there is already a Fastify hook that does just that.
      const scope_error = errorIfActionNotAllowed(request, action)
      if (scope_error) {
        const { code, body } = scope_error
        return reply.errorResponse(code, body)
      }

      const url = (request.body as any).url as string

      const result = await store.delete!(url)

      if (result.error) {
        const { error_description: original } = result.error
        const code = result.error.status_code || 500
        const status_text = result.error.status_text || 'Internal Server Error'
        const error_description = `Could not delete ${url} from media store ${store.info.name}: ${original}`

        request.log.error(
          `${PREFIX}${status_text} (${code}): ${error_description}`
        )

        // The Micropub spec doesn't define error codes for when it's the server's
        // fault.
        const error = 'delete_failed'

        const body = include_error_description
          ? { error, error_description }
          : { error }

        return reply.errorResponse(code, body)
      } else {
        const { summary } = result.value
        return reply.micropubDeleteSuccessResponse(summary)
      }
    }

    let data: MultipartFile | undefined
    try {
      data = await request.file()
    } catch (err: any) {
      const error_description = err.message
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    if (!data) {
      const error_description = 'multi-part request has no file'
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    let filename: string
    if (data.filename) {
      filename = data.filename
    } else if (data.fields.filename) {
      const value = data.fields.filename as MultipartValue<string>
      filename = value.value
    } else {
      const error_description = `request has no field 'filename'`
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const contentType = data.mimetype

    let body: Buffer
    try {
      body = await data.toBuffer()
    } catch (err: any) {
      const error_description = err.message
      request.log.warn(`${PREFIX}${error_description}`)

      // I am not sure it's actually the client's fault if we can't obtain the
      // buffer from the multipart request.
      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const result = await store.upload({ body, contentType, filename })

    if (result.error) {
      const { error_description: original } = result.error
      const status_code = result.error.status_code || 500
      const status_text = result.error.status_text || 'Internal Server Error'
      const error_description = `Could not upload file ${filename} to media store ${store.info.name}: ${original}`

      request.log.error(
        `${PREFIX}${status_text} (${status_code}): ${error_description}`
      )

      // The Micropub spec doesn't define error codes for when it's the server's
      // fault.
      const error = 'upload_failed'

      const body = include_error_description
        ? { error, error_description }
        : { error }

      return reply.errorResponse(status_code, body)
    }

    const { payload, summary, url } = result.value
    const code = result.value.status_code || 202 // 201
    const response_body = { summary, url, payload }

    reply.code(code)
    reply.header('Location', url)

    if (clientAcceptsHtml(request)) {
      return reply.view('file-upload-success.njk', {
        title: 'Upload success',
        description: 'Upload success page.',
        response_body: stringify(response_body, undefined, 2)
      })
    } else {
      return reply.send(response_body)
    }
  }

  return mediaPost
}

export interface MediaGetConfig<
  E extends BaseMediaStoreError = BaseMediaStoreError,
  V extends BaseMediaStoreValue = BaseMediaStoreValue
> {
  store: MediaStore<E, V>
}

export const defMediaGet = (config: MediaGetConfig) => {
  const { store } = config

  const mediaGet: RouteHandler = async (request, reply) => {
    // store capabilities
    const supports_delete = store.delete ? true : false
    const capabilities = { supports_upload: true, supports_delete }

    const code = 200
    const payload = { info: store.info, capabilities }

    if (clientAcceptsHtml(request)) {
      return reply.code(code).view('media-config.njk', {
        title: 'Media endpoint configuration',
        description: 'Configuration for the media endpoint.',
        data: stringify(payload, undefined, 2)
      })
    } else {
      return reply.code(code).send(payload)
    }
  }

  return mediaGet
}
