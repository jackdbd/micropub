import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { applyToDefaults } from '@hapi/hoek'
import mime from 'mime'
import { nanoid } from 'nanoid'
import type {
  MediaStore,
  StoreDelete,
  StoreUpload
} from '../micropub/store/index.js'

// For now, I only implemented the MediaStore interface.
export interface R2Store extends MediaStore {}
// TODO: implement the ContentStore and SyndicatorStore interfaces for R2.
// export interface R2Store extends ContentStore, MediaStore, SyndicatorStore {}

export interface Credentials {
  accessKeyId: string
  secretAccessKey: string
}

export interface Config {
  /**
   * You Cloudflare account ID.
   */
  account_id: string

  /**
   * The name of your Cloudflare R2 bucket.
   */
  bucket_name: string

  /**
   * The base path on the bucket where you want to upload files to (e.g. media/).
   */
  bucket_prefix?: string

  credentials: Credentials

  ignore_filename?: boolean

  /**
   * The base URL at which your files will be publicly accessible.
   *
   * @see https://developers.cloudflare.com/r2/buckets/public-buckets/
   */
  public_base_url: string
}

const defaults: Partial<Config> = {
  bucket_prefix: 'media/',
  ignore_filename: false
}

/**
 * Allow to upload files to a Cloudflare R2 bucket (R2 implements the S3 API).
 *
 * @see https://developers.cloudflare.com/r2/api/s3/api/
 */
export const defStore = (config: Config): R2Store => {
  const store_cfg = applyToDefaults(defaults, config) as Required<Config>

  const {
    account_id,
    bucket_name,
    bucket_prefix,
    credentials,
    ignore_filename
  } = store_cfg

  const public_base_url = store_cfg.public_base_url.endsWith('/')
    ? store_cfg.public_base_url
    : `${store_cfg.public_base_url}/`

  const region = 'auto'
  const endpoint = `https://${account_id}.r2.cloudflarestorage.com`

  const s3 = new S3Client({ region, endpoint, credentials })

  const name = `Cloudflare R2 bucket ${bucket_name} (prefix: ${bucket_prefix})`

  const public_root_url = `${public_base_url}${bucket_prefix}`

  const upload: StoreUpload = async (cfg) => {
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

  const hardDelete: StoreDelete = async (url) => {
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

  const info = {
    name,
    bucket_name,
    bucket_prefix,
    public_root_url,
    region,
    endpoint
  }

  return {
    delete: hardDelete,
    info,
    upload
  }
}
