import { S3Client } from '@aws-sdk/client-s3'
import { applyToDefaults } from '@hapi/hoek'
import { defHardDeleteMedia } from './delete.js'
import { defUpload } from './upload.js'

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
 * Allows to upload files to a Cloudflare R2 bucket (R2 implements the S3 API).
 *
 * @see [S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
 */
export const defR2 = (config: Config) => {
  const cfg = applyToDefaults(defaults, config) as Required<Config>

  const {
    account_id,
    bucket_name,
    bucket_prefix,
    credentials,
    ignore_filename
  } = cfg

  const public_base_url = cfg.public_base_url.endsWith('/')
    ? cfg.public_base_url
    : `${cfg.public_base_url}/`

  const region = 'auto'
  const endpoint = `https://${account_id}.r2.cloudflarestorage.com`

  const s3 = new S3Client({ region, endpoint, credentials })

  //   const name = `Cloudflare R2 bucket ${bucket_name} (prefix: ${bucket_prefix})`

  //   const public_root_url = `${public_base_url}${bucket_prefix}`

  //   const info = {
  //     name,
  //     bucket_name,
  //     bucket_prefix,
  //     public_root_url,
  //     region,
  //     endpoint
  //   }

  return {
    delete: defHardDeleteMedia({ bucket_name, bucket_prefix, s3 }),
    upload: defUpload({
      bucket_name,
      bucket_prefix,
      ignore_filename,
      public_base_url,
      s3
    })
  }
}
