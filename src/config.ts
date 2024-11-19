export interface Config {
  base_url: string
  cloudflare_account_id: string
  cloudflare_r2_access_key_id: string
  cloudflare_r2_bucket_name: string
  cloudflare_r2_secret_access_key: string
  github_owner: string
  github_repo: string
  github_token: string
  host: string
  log_level: string
  port: number
  report_all_ajv_errors: boolean
  secure_session_expiration: number
  secure_session_key_one_buf: string
  secure_session_key_two_buf: string
  telegram_chat_id: string
  telegram_token: string
  use_development_error_handler: boolean
  use_secure_flag_for_session_cookie: boolean
  NODE_ENV: string
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

  const telegram_chat_id = process.env.TELEGRAM_CHAT_ID
  if (!telegram_chat_id) {
    return { error: new Error('TELEGRAM_CHAT_ID not set') }
  }

  const telegram_token = process.env.TELEGRAM_TOKEN
  if (!telegram_token) {
    return { error: new Error('TELEGRAM_TOKEN not set') }
  }

  const config: Config = {
    base_url: process.env.BASE_URL || `http://localhost:${port}`,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_owner,
    github_repo,
    github_token,
    host: process.env.HOST || '0.0.0.0',
    log_level: process.env.LOG_LEVEL || 'info',
    port,
    report_all_ajv_errors: process.env.NODE_ENV === 'production' ? false : true,
    secure_session_expiration: 60 * 60, // in seconds
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    telegram_chat_id,
    telegram_token,
    use_development_error_handler:
      process.env.NODE_ENV === 'production' ? true : false,
    use_secure_flag_for_session_cookie:
      process.env.NODE_ENV === 'production' ? true : false,
    NODE_ENV: process.env.NODE_ENV || 'production'
  }

  const sensitive = new Set([
    'cloudflare_r2_access_key_id',
    'cloudflare_r2_secret_access_key',
    'github_token',
    'secure_session_key_one_buf',
    'secure_session_key_two_buf',
    'telegram_token'
  ])

  const entries = Object.entries(config).filter(([key]) => {
    return sensitive.has(key) ? false : true
  })

  if (config.NODE_ENV !== 'test') {
    console.log(
      `=== CONFIG ===`,
      Object.fromEntries(entries),
      `${sensitive.size} sensitive fields not shown`,
      [...sensitive]
    )
  }

  return { value: config }
}
