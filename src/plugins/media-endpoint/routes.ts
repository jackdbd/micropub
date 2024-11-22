import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import type { RouteHandler } from 'fastify'
import { NAME } from './constants.js'

const PREFIX = `${NAME}/routes`

export interface MediaPostConfig {
  base_url: string
  bucket_name: string
  s3: S3Client
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
  const { base_url, bucket_name, s3 } = config

  const mediaPost: RouteHandler = async (request, reply) => {
    if (!request.isMultipart()) {
      const message =
        'request is not multi-part (TIP: use Content-Type: multipart/form-data to make requests to the media endpoint)'
      request.log.warn(
        `${PREFIX} request ${request.id} is not a multi-part request`
      )
      return reply.micropubInvalidRequest(message)
    }

    let data: MultipartFile | undefined
    try {
      data = await request.file()
    } catch (err: any) {
      request.log.warn(`${PREFIX} ${err.message}`)
      return reply.micropubInvalidRequest(err.message)
    }

    if (!data) {
      const message = 'multi-part request has no file'
      request.log.warn(`${PREFIX} ${message}`)
      return reply.micropubInvalidRequest(message)
    }

    let filename: string
    if (data.filename) {
      filename = data.filename
    } else if (data.fields.filename) {
      const value = data.fields.filename as MultipartValue<string>
      filename = value.value
    } else {
      const message = `request has no field 'filename'`
      request.log.warn(`${PREFIX} ${message}`)
      return reply.micropubInvalidRequest(message)
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
