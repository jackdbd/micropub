import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { DeleteContentOrMedia } from '../../lib/schemas/index.js'

export interface Config {
  bucket_name: string
  bucket_prefix: string
  s3: S3Client
}

export const defHardDeleteMedia = (config: Config) => {
  const { bucket_name, bucket_prefix, s3 } = config

  const hardDeleteMedia: DeleteContentOrMedia = async (url) => {
    const splits = url.split('/')
    const filename = splits.at(-1)!

    const bucket_path = `${bucket_prefix}${filename}`

    const params = {
      Bucket: bucket_name,
      Key: bucket_path
    }

    try {
      const output = await s3.send(new DeleteObjectCommand(params))
      // The output is the same, whether the object existed and was deleted, or
      // if it didn't exist in the first place.

      const { VersionId: version_id, $metadata: meta } = output
      const status_code = meta.httpStatusCode || 204
      const status_text = status_code === 204 ? 'No Content' : 'Success'

      const summary = version_id
        ? `File that was hosted on Cloudflare R2 bucket ${bucket_name} at ${bucket_path} (Version ID: ${version_id}) is no longer available at ${url}`
        : `File that was hosted on Cloudflare R2 bucket ${bucket_name} at ${bucket_path} is no longer available at ${url}`

      return {
        value: {
          status_code,
          status_text,
          summary,
          payload: { version_id }
        }
      }
    } catch (err: any) {
      const error_description =
        err.message ||
        `Failed to hard-delete file hosted on Cloudflare R2 bucket ${bucket_name} at ${bucket_path}`
      return {
        error: new Error(error_description)
      }
    }
  }

  return hardDeleteMedia
}
