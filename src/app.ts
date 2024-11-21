import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'
import { fastifyRequestContext } from '@fastify/request-context'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import view from '@fastify/view'
import sensible from '@fastify/sensible'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import stringify from 'fast-safe-stringify'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import { defStore } from './lib/github-contents/store.js'
import youch from './plugins/youch/index.js'
import errorHandler from './plugins/error-handler/index.js'
import indieauth from './plugins/indieauth/index.js'
import micropub from './plugins/micropub-endpoint/index.js'
import introspectionEndpoint from './plugins/introspect-endpoint/index.js'
import revocationEndpoint from './plugins/revocation-endpoint/index.js'
import userinfoEndpoint from './plugins/userinfo-endpoint/index.js'
import tokenEndpoint from './plugins/token-endpoint/index.js'
import { tap } from './nunjucks/filters.js'
import { sensitive_fields, unsentiveEntries, type Config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

declare module '@fastify/request-context' {
  interface RequestContextData {
    action?: string
    error_details?: string[]
    jf2?: Jf2
    user: { id: string }
  }
}

// https://github.com/fastify/fastify-secure-session?tab=readme-ov-file#add-typescript-types
declare module '@fastify/secure-session' {
  interface SessionData {
    code_challenge: string
    code_verifier: string
    jwt: string
    scope: string
    state: string
  }
}

/**
 * Instantiates the Fastify app.
 */
export function defFastify(config: Config) {
  const {
    access_token_expiration,
    base_url,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_owner,
    github_repo,
    github_token,
    log_level,
    me,
    report_all_ajv_errors,
    secure_session_expiration,
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    syndicate_to,
    telegram_chat_id,
    telegram_token,
    use_development_error_handler,
    use_secure_flag_for_session_cookie
  } = config

  const fastify = Fastify({ logger: { level: log_level } })

  fastify.register(sensible)

  fastify.register(fastifyRequestContext, {
    defaultStoreValues: {
      user: { id: 'system' }
    }
  })

  const sessionName = 'session'

  fastify.register(secureSession, {
    key: [
      Buffer.from(secure_session_key_one_buf, 'hex'),
      Buffer.from(secure_session_key_two_buf, 'hex')
    ],
    sessionName,
    expiry: secure_session_expiration,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: use_secure_flag_for_session_cookie
    }
  })
  fastify.log.debug(
    {
      sessionName,
      expiry: secure_session_expiration
    },
    `secure session created`
  )

  fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/secure-session'
  })

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
  })

  if (use_development_error_handler) {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(errorHandler, {
      telegram: { chat_id: telegram_chat_id, token: telegram_token }
    })
  }

  const issuer = base_url

  fastify.register(tokenEndpoint, {
    algorithm: 'HS256',
    baseUrl: base_url,
    expiration: access_token_expiration,
    issuer
  })

  const client_id = base_url

  fastify.register(introspectionEndpoint, { clientId: client_id, me })
  fastify.register(revocationEndpoint, {})
  fastify.register(userinfoEndpoint, {})

  fastify.register(indieauth, {
    // authorizationCallbackRoute: '/auth/callback',
    // authorizationEndpoint: 'https://indieauth.com/auth',
    baseUrl: base_url,
    clientId: client_id,
    me
  })

  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const token_endpoint = `${base_url}/token`
  const micropub_endpoint = `${base_url}/micropub`
  const media_endpoint = `${base_url}/media`
  const submit_endpoint = `${base_url}/submit`

  const store = defStore({
    owner: github_owner,
    repo: github_repo,
    token: github_token,
    committer: {
      name: 'Giacomo Debidda',
      email: 'giacomo@giacomodebidda.com'
    }
  })

  fastify.register(micropub, {
    baseUrl: base_url,
    clientId: client_id,
    cloudflareAccountId: cloudflare_account_id,
    cloudflareR2AccessKeyId: cloudflare_r2_access_key_id,
    cloudflareR2BucketName: cloudflare_r2_bucket_name,
    cloudflareR2SecretAccessKey: cloudflare_r2_secret_access_key,
    me,
    mediaEndpoint: media_endpoint,
    micropubEndpoint: micropub_endpoint,
    reportAllAjvErrors: report_all_ajv_errors,
    store,
    submitEndpoint: submit_endpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint: token_endpoint
  })

  fastify.register(view, {
    engine: { nunjucks },
    templates: [path.join(__dirname, 'templates')],
    options: {
      onConfigure: (env: Environment) => {
        env.addFilter('tap', tap)
        fastify.log.debug(`nunjucks environment configured`)
      }
    }
  })

  fastify.get('/', async (_request, reply) => {
    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'World'
    })
  })

  fastify.get('/config', async (_request, reply) => {
    const non_sensitive = Object.fromEntries(unsentiveEntries(config))
    return reply.view('config.njk', {
      description: 'Configuration of the app',
      title: 'Config',
      non_sensitive: stringify(non_sensitive, undefined, 2),
      sensitive_fields
    })
  })

  return fastify
}
