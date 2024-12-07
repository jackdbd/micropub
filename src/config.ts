import type { JWK } from 'jose'
import type { SyndicateToItem } from './lib/micropub/index.js'

// TODO: use a short-lived access token (e.g. 3600 seconds) and a long-lived
// refresh token.
// const access_token_expiration = '5 minutes'
const access_token_expiration = '72 hours'

const me = 'https://giacomodebidda.com/'

// Max file size (in bytes) for multipart/form-data requests
// 10MB might be enough for a photo or an audio file, but not for a video.
// TODO: try setting this to 1 byte to test error handling in media endpoint.
const multipart_form_data_max_file_size = 10_000_000

// const soft_delete = true
const soft_delete = false

// TODO: read syndication_to from a JSON file?
const syndicate_to: SyndicateToItem[] = [
  {
    uid: 'https://fosstodon.org/@jackdbd',
    name: 'jackdbd on Mastodon',
    service: {
      name: 'Mastodon',
      url: 'https://fosstodon.org/',
      photo:
        'https://cdn.fosstodon.org/accounts/avatars/000/028/400/original/324cba4cb379bd4e.png'
    },
    user: {
      name: 'jackdbd',
      url: 'https://fosstodon.org/@jackdbd',
      photo:
        'https://cdn.fosstodon.org/accounts/avatars/109/632/759/548/530/989/original/7662659b2847db84.jpeg'
    }
  },
  // TODO: https://news.indieweb.org/how-to-submit-a-post
  {
    uid: 'https://news.indieweb.org/en',
    name: 'giacomodebidda.com on IndieNews',
    service: {
      name: 'IndieNews',
      url: 'https://news.indieweb.org/en',
      photo:
        'https://indieweb.org/images/thumb/6/67/indiewebcamp-logo-lockup-color%403x.png/800px-indiewebcamp-logo-lockup-color%403x.png'
    }
  },
  {
    uid: 'https://t.me/+rQSrJsu5RtgzNjM0',
    name: 'Telegram GitHub Group'
  }
]

const should_media_endpoint_ignore_filename = false
// const should_media_endpoint_ignore_filename = true

/**
 * Configuration for the entire app.
 */
export interface Config {
  access_token_expiration: string
  authorization_callback_route: string
  authorization_endpoint: string
  base_url: string
  cloudflare_account_id: string
  cloudflare_r2_access_key_id: string
  cloudflare_r2_bucket_name: string
  cloudflare_r2_secret_access_key: string
  github_owner: string
  github_repo: string
  github_token: string
  host: string

  /**
   * Whether to include the `error_description` property in all JSON responses.
   *
   * This property is a human-readable description of the error message, used to
   * assist the client developer in understanding the error. This property is
   * not meant to be shown to the end user.
   * @see [Micropub Error Response](https://micropub.spec.indieweb.org/#error-response-p-4)
   */
  include_error_description: boolean

  indieauth_client_id: string

  issuer: string

  /**
   * **Private** JSON Web Key Set (JWKS).
   *
   * This private JWKS is used by the token endpoint to sign JSON Web Tokens (JWTs).
   * It should contain at least one private key.
   *
   * **Sensitive:** This key should never be logged, and should be stored securely
   * (e.g. in a secret management system).
   * @sensitive
   */
  jwks: { keys: JWK[] }

  /**
   * URL where the **public** JSON Web Key Set (JWKS) is hosted.
   */
  jwks_url: URL

  log_level: string
  me: string
  media_endpoint: string
  media_public_base_url: string
  micropub_endpoint: string
  multipart_form_data_max_file_size: number
  port: number
  report_all_ajv_errors: boolean
  secure_session_expiration: number
  secure_session_key_one_buf: string
  secure_session_key_two_buf: string
  should_media_endpoint_ignore_filename: boolean
  soft_delete: boolean
  submit_endpoint: string
  syndicate_to: SyndicateToItem[]
  telegram_chat_id: string
  telegram_token: string
  token_endpoint: string
  use_development_error_handler: boolean
  use_secure_flag_for_session_cookie: boolean
  NODE_ENV: string
}

const SENSITIVE = new Set([
  'cloudflare_r2_access_key_id',
  'cloudflare_r2_secret_access_key',
  'github_token',
  'jwks',
  'secure_session_key_one_buf',
  'secure_session_key_two_buf',
  'telegram_token'
])

export const sensitive_fields = [...SENSITIVE]

export const sentiveEntries = (config: Config) => {
  return Object.entries(config).filter(([key]) => {
    return SENSITIVE.has(key) ? true : false
  })
}

export const unsentiveEntries = (config: Config) => {
  return Object.entries(config).filter(([key]) => {
    return SENSITIVE.has(key) ? false : true
  })
}

// Most likely, a few configuration values will be asynchronous. Here is why
// this function is async.
export const defConfig = async () => {
  // port should match the internal_port specified in fly.toml
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

  const cloudflare_account_id = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!cloudflare_account_id) {
    return { error: new Error('CLOUDFLARE_ACCOUNT_ID not set') }
  }

  const cloudflare_r2_bucket_name = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!cloudflare_r2_bucket_name) {
    return { error: new Error('CLOUDFLARE_R2_BUCKET_NAME not set') }
  }

  const cloudflare_r2_access_key_id = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  if (!cloudflare_r2_access_key_id) {
    return { error: new Error('CLOUDFLARE_R2_ACCESS_KEY_ID not set') }
  }

  const cloudflare_r2_secret_access_key =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  if (!cloudflare_r2_secret_access_key) {
    return { error: new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY not set') }
  }

  const github_owner = process.env.GITHUB_OWNER
  if (!github_owner) {
    return { error: new Error('GITHUB_OWNER not set') }
  }

  const github_repo = process.env.GITHUB_REPO
  if (!github_repo) {
    return { error: new Error('GITHUB_REPO not set') }
  }

  const github_token = process.env.GITHUB_TOKEN
  if (!github_token) {
    return { error: new Error('GITHUB_TOKEN not set') }
  }

  // const include_error_description = process.env.INCLUDE_ERROR_DESCRIPTION
  //   ? true
  //   : false

  const include_error_description = true

  const jwks_private = process.env.JWKS
  if (!jwks_private) {
    return { error: new Error('JWKS not set') }
  }

  const jwks = JSON.parse(jwks_private) as { keys: JWK[] }

  const report_all_ajv_errors =
    process.env.NODE_ENV === 'development' ? true : false

  const secure_session_key_one_buf = process.env.SECURE_SESSION_KEY_ONE
  if (!secure_session_key_one_buf) {
    return { error: new Error('SECURE_SESSION_KEY_ONE not set') }
  }

  const secure_session_key_two_buf = process.env.SECURE_SESSION_KEY_TWO
  if (!secure_session_key_two_buf) {
    return { error: new Error('SECURE_SESSION_KEY_TWO not set') }
  }

  const telegram_chat_id = process.env.TELEGRAM_CHAT_ID
  if (!telegram_chat_id) {
    return { error: new Error('TELEGRAM_CHAT_ID not set') }
  }

  const telegram_token = process.env.TELEGRAM_TOKEN
  if (!telegram_token) {
    return { error: new Error('TELEGRAM_TOKEN not set') }
  }

  // Either passing base_url to the nunjucks templates or not is fine. But if we
  // do pass it, we need to make sure to specify 'https' when we're not on
  // localhost, otherwise we will have mixed content errors.
  const base_url = process.env.BASE_URL || `http://localhost:${port}`

  const authorization_callback_route = '/auth/callback'
  const indieauth_client_id = base_url
  const issuer = base_url

  // ENDPOINTS /////////////////////////////////////////////////////////////////
  const authorization_endpoint = 'https://indieauth.com/auth'
  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const token_endpoint = `${base_url}/token`
  const micropub_endpoint = `${base_url}/micropub`
  const media_endpoint = `${base_url}/media`
  const media_public_base_url = 'https://content.giacomodebidda.com/'
  const submit_endpoint = `${base_url}/submit`
  //////////////////////////////////////////////////////////////////////////////

  const jwks_url = process.env.JWKS_PUBLIC_URL
    ? new URL(process.env.JWKS_PUBLIC_URL)
    : new URL('https://content.giacomodebidda.com/misc/jwks-public.json')

  const config: Config = {
    authorization_callback_route,
    authorization_endpoint,
    base_url,
    access_token_expiration,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_owner,
    github_repo,
    github_token,
    host: process.env.HOST || '0.0.0.0',
    include_error_description,
    indieauth_client_id,
    issuer,
    jwks,
    jwks_url,
    log_level: process.env.PINO_LOG_LEVEL || 'info',
    me,
    media_endpoint,
    media_public_base_url,
    micropub_endpoint,
    multipart_form_data_max_file_size,
    port,
    report_all_ajv_errors,
    secure_session_expiration: 60 * 60, // in seconds
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    should_media_endpoint_ignore_filename,
    soft_delete,
    submit_endpoint,
    syndicate_to,
    telegram_chat_id,
    telegram_token,
    token_endpoint,
    use_development_error_handler:
      process.env.NODE_ENV === 'development' ? true : false,
    use_secure_flag_for_session_cookie:
      process.env.NODE_ENV === 'production' ? true : false,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }

  return { value: config }
}
