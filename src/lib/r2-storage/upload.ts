import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import mime from 'mime'
import { nanoid } from 'nanoid'
import type { UploadMedia } from '../../lib/schemas/index.js'

export interface Config {
  bucket_name: string
  bucket_prefix: string
  ignore_filename: boolean
  public_base_url: string
  s3: S3Client
}

export const defUpload = (config: Config) => {
  const { bucket_name, bucket_prefix, ignore_filename, public_base_url, s3 } =
    config

  const upload: UploadMedia = async (cfg) => {
    const { body: Body, contentType: ContentType } = cfg

    const filename = ignore_filename
      ? `${nanoid()}.${mime.getExtension(ContentType)}`
      : cfg.filename

    const bucket_path = `${bucket_prefix}${filename}`
    const public_url = `${public_base_url}${bucket_prefix}${filename}`

    const params = {
      Bucket: bucket_name,
      Key: bucket_path,
      Body,
      ContentType
    }

    try {
      const output = await s3.send(new PutObjectCommand(params))

      const { ETag: etag, VersionId: version_id, $metadata: meta } = output
      const status_code = meta.httpStatusCode || 200
      const status_text = status_code === 201 ? 'Created' : 'Success'
      const summary = `File ${ContentType} uploaded to Cloudflare R2 bucket ${bucket_name} at ${bucket_path} and publicly available at ${public_url} (ETag: ${etag}, Version ID: ${version_id})`

      return {
        value: {
          status_code,
          status_text,
          summary,
          payload: { etag, version_id },
          url: public_url
        }
      }
    } catch (err: any) {
      // The error from the S3 SDK is not useful at all.
      const error_description =
        err.message ||
        `Failed to upload file ${filename} to Cloudflare R2 bucket ${bucket_name} at ${bucket_path}`
      return {
        error: new Error(error_description)
      }
    }
  }

  return upload
}
