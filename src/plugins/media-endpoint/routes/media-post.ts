import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import type { RouteHandler } from 'fastify'
import { defErrorIfActionNotAllowed } from '../../../lib/error-if-action-not-allowed.js'
import {
  type Action,
  invalidRequest,
  serverError
} from '../../../lib/micropub/index.js'
import type {
  DeleteContentOrMedia,
  UploadMedia
} from '../../../lib/schemas/index.js'
import { NAME } from '../constants.js'

const PREFIX = `${NAME}/routes `

interface Config {
  delete: DeleteContentOrMedia
  include_error_description: boolean
  upload: UploadMedia
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
 * @see [Media Endpoint](https://micropub.spec.indieweb.org/#media-endpoint)
 * @see [Request to the Media Endpoint](https://micropub.spec.indieweb.org/#request)
 * @see [Response from the Media Endpoint](https://www.w3.org/TR/micropub/#response-3)
 * @see [Uploading Files](https://micropub.spec.indieweb.org/#uploading-files)
 */
export const defMediaPost = (config: Config) => {
  const { delete: deleteMedia, include_error_description, upload } = config

  const errorIfActionNotAllowed = defErrorIfActionNotAllowed({
    include_error_description,
    log_prefix: 'POST media/'
  })

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      const action = (request.body as any).action as Action

      if (action !== 'delete') {
        const { code, body } = invalidRequest({
          error_description: `action '${action}' is not supported by this media endpoint`,
          include_error_description
        })
        return reply.errorResponse(code, body)
      }

      // const store_error = errorIfMethodNotImplementedInStore(store, action)
      // if (store_error) {
      //   const { code, body } = store_error
      //   return reply.errorResponse(code, body)
      // }

      // We should also check the presence of a 'media' scope in the access token
      // claims. But there is already a Fastify hook that does just that.
      const scope_error = errorIfActionNotAllowed(request, action)
      if (scope_error) {
        const { code, body } = scope_error
        return reply.errorResponse(code, body)
      }

      const url = (request.body as any).url as string

      const result = await deleteMedia(url)

      if (result.error) {
        const original = result.error.message
        const error_description = `Could not delete ${url} from media store: ${original}`
        request.log.error(`${PREFIX}: ${error_description}`)

        const { code, body } = serverError({
          error: 'delete_failed',
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, body)
      } else {
        const code = 200
        // const url = result.value.url || ''
        const summary = `${url} deleted`
        // const payload = result.value.payload

        return reply.successResponse(code, {
          title: 'Delete success',
          description: 'Delete success page',
          summary
        })
      }
    }

    let data: MultipartFile | undefined
    try {
      data = await request.file()
      // request.log.warn({ data }, '====== INCOMING DATA ======')
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

    const result = await upload({ body, contentType, filename })

    if (result.error) {
      const original = result.error.message
      const error_description = `Could not upload file ${filename} to media store: ${original}`
      request.log.error(`${PREFIX}: ${error_description}`)

      const { code, body } = serverError({
        error: 'upload_failed',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const code = 202 // or 201
    const url = result.value.url
    const summary = `File uploaded successfully to ${url}`

    reply.header('Location', url)

    return reply.successResponse(code, {
      title: 'Upload success',
      description: 'Upload success page',
      summary
      // payload: result.value.payload
    })
  }

  return mediaPost
}
