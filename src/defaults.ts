export const ACCESS_TOKEN_EXPIRATION = '15 minutes'
// export const ACCESS_TOKEN_EXPIRATION = '3600 seconds' // this is quite common
// export const ACCESS_TOKEN_EXPIRATION = '72 hours'

export const AUTHORIZATION_CALLBACK_ROUTE = '/auth/callback'

export const AUTHORIZATION_CODE_EXPIRATION = '60 seconds'

// export const AUTHORIZATION_ENDPOINT = 'https://indieauth.com/auth'

export const AUTHORIZATION_START_ROUTE = '/auth/start'

export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID

export const CLOUDFLARE_R2_ACCESS_KEY_ID =
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID

export const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME

export const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY

export const GITHUB_OWNER = process.env.GITHUB_OWNER
export const GITHUB_REPO = process.env.GITHUB_REPO
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export const INCLUDE_ERROR_DESCRIPTION = true
// export const INCLUDE_ERROR_DESCRIPTION = false

export const JWKS = process.env.JWKS

export const JWKS_PUBLIC_URL =
  'https://content.giacomodebidda.com/misc/jwks-pub.json'

export const LOG_LEVEL = process.env.PINO_LOG_LEVEL || 'info'

export const ME = 'https://giacomodebidda.com/'

export const MEDIA_PUBLIC_BASE_URL = 'https://content.giacomodebidda.com/'

// Max file size (in bytes) for multipart/form-data requests
// 10MB might be enough for a photo or an audio file, but not for a video.
// TODO: try setting this to 1 byte to test error handling in media endpoint.
export const MULTIPART_FORMDATA_MAX_FILESIZE = 10_000_000

// export const REFRESH_TOKEN_EXPIRATION = '7 days'
export const REFRESH_TOKEN_EXPIRATION = '30 days'

export const REPORT_ALL_AJV_ERRORS =
  process.env.NODE_ENV === 'development' ? true : false

export const SECURE_SESSION_EXPIRATION = 60 * 60 // in seconds
export const SECURE_SESSION_KEY_ONE = process.env.SECURE_SESSION_KEY_ONE
export const SECURE_SESSION_KEY_TWO = process.env.SECURE_SESSION_KEY_TWO

export const SHOULD_USE_DEVELOPMENT_ERROR_HANDLER =
  process.env.NODE_ENV === 'development' ? true : false

export const SHOULD_MEDIA_ENDPOINT_IGNORE_FILENAME = false

export const SHOULD_USE_SECURE_FLAG_FOR_SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? true : false

export const SHOULD_USE_SOFT_DELETE = false

export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN

// export const TOKEN_ENDPOINT = 'https://tokens.indieauth.com/token'
