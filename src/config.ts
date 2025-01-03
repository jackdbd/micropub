import type { SyndicateToItem } from './lib/micropub/index.js'
import type { JWKSPrivate, JWKSPublicURL } from './lib/schemas/jwks.js'
import * as DEFAULT from './defaults.js'

const REQUIRED_ENV_VARS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'GITHUB_OAUTH_APP_CLIENT_ID',
  'GITHUB_OAUTH_APP_CLIENT_SECRET',
  'GITHUB_OWNER',
  'GITHUB_REPO',
  'GITHUB_TOKEN',
  'JWKS',
  'SECURE_SESSION_KEY_ONE',
  'SECURE_SESSION_KEY_TWO',
  'TELEGRAM_CHAT_ID',
  'TELEGRAM_TOKEN'
]

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

/**
 * Configuration for the entire app.
 */
export interface Config {
  access_token_expiration: string
  authorization_code_expiration: string
  authorization_endpoint: string
  cloudflare_account_id: string
  cloudflare_r2_access_key_id: string
  cloudflare_r2_bucket_name: string
  cloudflare_r2_secret_access_key: string
  github_oauth_client_id: string
  github_oauth_client_secret: string
  github_auth_start_path: string
  github_auth_redirect_path: string
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
  indieauth_client_logo_uri: string
  indieauth_client_name: string
  indieauth_client_uri: string
  indieauth_client_redirect_uris: string[]

  introspection_endpoint: string

  /**
   * Issuer identifier of the authorization server.
   *
   * The issuer identifier is a URL that uses the "https" scheme and has no
   * query or fragment components as defined in RFC9207. It MUST also be a
   * prefix of the indieauth-metadata URL.
   *
   * @see [Issuer Identifier](https://indieauth.spec.indieweb.org/#issuer-identifier)
   * @see [OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207)
   */
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
  jwks: JWKSPrivate

  /**
   * URL where the **public** JSON Web Key Set (JWKS) is hosted.
   */
  jwks_url: JWKSPublicURL

  log_level: string
  me: string
  media_endpoint: string
  media_public_base_url: string
  micropub_endpoint: string
  multipart_form_data_max_file_size: number
  port: number
  refresh_token_expiration: string
  report_all_ajv_errors: boolean
  revocation_endpoint: string
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
  userinfo_endpoint: string
  NODE_ENV: string
}

export const SENSITIVE = new Set([
  'cloudflare_r2_access_key_id',
  'cloudflare_r2_secret_access_key',
  'github_oauth_client_secret',
  'github_token',
  'jwks',
  'secure_session_key_one_buf',
  'secure_session_key_two_buf',
  'telegram_token'
])

// These configuration values are not sensitive, but either they can't be
// rendered in a template (e.g. a function), or they fail to render in a
// template (e.g. ajv).
export const DO_NOT_RENDER = new Set(['ajv'] as string[])

// export const sensitive_fields = [...SENSITIVE]

// export const sentiveEntries = (config: Config) => {
//   return Object.entries(config).filter(([key]) => {
//     return SENSITIVE.has(key) ? true : false
//   })
// }

// export const unsentiveEntries = (config: Config) => {
//   return Object.entries(config).filter(([key]) => {
//     return SENSITIVE.has(key) ? false : true
//   })
// }

export const entriesSafeToRender = (config: Config) => {
  return Object.entries(config).filter(([key]) => {
    const hide = SENSITIVE.has(key) || DO_NOT_RENDER.has(key)
    return hide ? false : true
  })
}

// Most likely, a few configuration values will be asynchronous. Here is why
// this function is async.
export const defConfig = async (): Promise<Config> => {
  // port should match the internal_port specified in fly.toml
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

  REQUIRED_ENV_VARS.forEach((key) => {
    if (process.env[key] === undefined) {
      throw new Error(`key ${key} not set in process.env`)
    }
  })

  // const secure_session_key_one_buf = DEFAULT.SECURE_SESSION_KEY_ONE
  // if (!secure_session_key_one_buf) {
  //   return { error: new Error('SECURE_SESSION_KEY_ONE not set') }
  // }

  // Either passing base_url to the nunjucks templates or not is fine. But if we
  // do pass it, we need to make sure to specify 'https' when we're not on
  // localhost, otherwise we will have mixed content errors.
  const base_url = process.env.BASE_URL || `http://localhost:${port}`

  // Example of IndieAuth/Micropub client: https://indiebookclub.biz/id
  const indieauth_client_id = `${base_url}/id`
  const indieauth_client_logo_uri = 'https://indiebookclub.biz/images/book.svg'
  const indieauth_client_name = 'Zephyr'
  const indieauth_client_uri = base_url
  const indieauth_client_redirect_uris = [`${base_url}/auth/callback`]

  const issuer = base_url

  // ENDPOINTS /////////////////////////////////////////////////////////////////
  const authorization_endpoint = `${base_url}/auth`

  // It seems that indielogin.com is just for authentication. The tokens
  // generated when I authenticate with indielogin.com have no scopes.
  // const authorization_endpoint = 'https://indielogin.com/auth'

  // The tokens generated when I authenticate with indieauth.com have the scopes
  // I set in the sign-in form.
  // const authorization_endpoint = 'https://indieauth.com/auth'

  const introspection_endpoint = `${base_url}/introspect`
  const media_endpoint = `${base_url}/media`
  const micropub_endpoint = `${base_url}/micropub`
  const revocation_endpoint = `${base_url}/revoke`
  const submit_endpoint = `${base_url}/submit`
  const token_endpoint = `${base_url}/token`
  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const userinfo_endpoint = `${base_url}/userinfo`

  const github_oauth_client_id = process.env.GITHUB_OAUTH_APP_CLIENT_ID!
  const github_oauth_client_secret = process.env.GITHUB_OAUTH_APP_CLIENT_SECRET!
  const github_auth_start_path = '/auth/github'
  const github_auth_redirect_path = '/auth/github/callback'

  //////////////////////////////////////////////////////////////////////////////

  // In some environments (e.g. Fly.io) we need to set JWKS as an escaped JSON
  // string (e.g. "{\"keys\":[]}"). So in those environments we need to call
  // JSON.parse twice to build the actual JS object.
  let jwks: JWKSPrivate = JSON.parse(DEFAULT.JWKS!)
  if (typeof jwks === 'string') {
    jwks = JSON.parse(jwks)
  }

  return {
    access_token_expiration: DEFAULT.ACCESS_TOKEN_EXPIRATION,
    authorization_code_expiration: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
    authorization_endpoint,
    cloudflare_account_id: DEFAULT.CLOUDFLARE_ACCOUNT_ID!,
    cloudflare_r2_access_key_id: DEFAULT.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    cloudflare_r2_bucket_name: DEFAULT.CLOUDFLARE_R2_BUCKET_NAME!,
    cloudflare_r2_secret_access_key: DEFAULT.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    github_oauth_client_id,
    github_oauth_client_secret,
    github_auth_start_path,
    github_auth_redirect_path,
    github_owner: DEFAULT.GITHUB_OWNER!,
    github_repo: DEFAULT.GITHUB_REPO!,
    github_token: DEFAULT.GITHUB_TOKEN!,
    host: process.env.HOST || '0.0.0.0',
    include_error_description: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
    indieauth_client_id,
    indieauth_client_logo_uri,
    indieauth_client_name,
    indieauth_client_uri,
    indieauth_client_redirect_uris,
    introspection_endpoint,
    issuer,
    jwks,
    jwks_url: new URL(DEFAULT.JWKS_PUBLIC_URL),
    log_level: DEFAULT.LOG_LEVEL,
    me: DEFAULT.ME,
    media_endpoint,
    media_public_base_url: DEFAULT.MEDIA_PUBLIC_BASE_URL,
    micropub_endpoint,
    multipart_form_data_max_file_size: DEFAULT.MULTIPART_FORMDATA_MAX_FILESIZE,
    port,
    refresh_token_expiration: DEFAULT.REFRESH_TOKEN_EXPIRATION,
    report_all_ajv_errors: DEFAULT.REPORT_ALL_AJV_ERRORS,
    revocation_endpoint,
    secure_session_expiration: DEFAULT.SECURE_SESSION_EXPIRATION,
    secure_session_key_one_buf: DEFAULT.SECURE_SESSION_KEY_ONE!,
    secure_session_key_two_buf: DEFAULT.SECURE_SESSION_KEY_TWO!,
    should_media_endpoint_ignore_filename:
      DEFAULT.SHOULD_MEDIA_ENDPOINT_IGNORE_FILENAME,
    soft_delete: DEFAULT.SHOULD_USE_SOFT_DELETE,
    submit_endpoint,
    syndicate_to,
    telegram_chat_id: DEFAULT.TELEGRAM_CHAT_ID!,
    telegram_token: DEFAULT.TELEGRAM_TOKEN!,
    token_endpoint,
    use_development_error_handler: DEFAULT.SHOULD_USE_DEVELOPMENT_ERROR_HANDLER,
    use_secure_flag_for_session_cookie:
      DEFAULT.SHOULD_USE_SECURE_FLAG_FOR_SESSION_COOKIE,
    userinfo_endpoint,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
}
