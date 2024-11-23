import type { SyndicateToItem } from './plugins/micropub-endpoint/syndication.js'

// TODO: use a short-lived access token (e.g. 3600 seconds) and a long-lived
// refresh token.
const access_token_expiration = '72 hours'
// const access_token_expiration = '5 seconds'

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
  }
]

export interface Config {
  access_token_expiration: string
  base_url: string
  cloudflare_account_id: string
  cloudflare_r2_access_key_id: string
  cloudflare_r2_bucket_name: string
  cloudflare_r2_secret_access_key: string
  github_owner: string
  github_repo: string
  github_token: string
  host: string
  include_error_description: boolean
  log_level: string
  me: string
  multipart_form_data_max_file_size: number
  port: number
  report_all_ajv_errors: boolean
  secure_session_expiration: number
  secure_session_key_one_buf: string
  secure_session_key_two_buf: string
  soft_delete: boolean
  syndicate_to: SyndicateToItem[]
  telegram_chat_id: string
  telegram_token: string
  use_development_error_handler: boolean
  use_secure_flag_for_session_cookie: boolean
  NODE_ENV: string
}

const SENSITIVE = new Set([
  'cloudflare_r2_access_key_id',
  'cloudflare_r2_secret_access_key',
  'github_token',
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

export const defConfig = () => {
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

  const secure_session_key_one_buf = process.env.SECURE_SESSION_KEY_ONE
  if (!secure_session_key_one_buf) {
    return { error: new Error('SECURE_SESSION_KEY_ONE not set') }
  }

  const secure_session_key_two_buf = process.env.SECURE_SESSION_KEY_TWO
  if (!secure_session_key_two_buf) {
    return { error: new Error('SECURE_SESSION_KEY_TWO not set') }
  }

  const include_error_description = process.env.INCLUDE_ERROR_DESCRIPTION
    ? true
    : false

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

  const config: Config = {
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
    log_level: process.env.PINO_LOG_LEVEL || 'info',
    me,
    multipart_form_data_max_file_size,
    port,
    report_all_ajv_errors:
      process.env.NODE_ENV === 'development' ? true : false,
    secure_session_expiration: 60 * 60, // in seconds
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    soft_delete,
    syndicate_to,
    telegram_chat_id,
    telegram_token,
    use_development_error_handler:
      process.env.NODE_ENV === 'development' ? true : false,
    use_secure_flag_for_session_cookie:
      process.env.NODE_ENV === 'production' ? true : false,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }

  return { value: config }
}
