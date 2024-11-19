import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import view from '@fastify/view'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import sensible from '@fastify/sensible'
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
import type { Config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    base_url,
    report_all_ajv_errors,
    secure_session_expiration,
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    telegram_chat_id,
    telegram_token,
    use_development_error_handler,
    use_secure_flag_for_session_cookie
  } = config

  const fastify = Fastify({ logger: { level: config.log_level } })

  fastify.register(sensible)

  // parse multipart requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: 10_000_000 // in bytes
    }
  })

  // parse x-www-form-urlencoded bodies
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

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
    expiration: '72 hours', // TODO: use a short-lived access token (e.g. 3600 seconds)
    issuer
  })

  const client_id = base_url
  const me = 'https://giacomodebidda.com/'

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

  const syndicate_to = [
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
    }
  ]

  const store = defStore({
    owner: config.github_owner,
    repo: config.github_repo,
    token: config.github_token,
    committer: {
      name: 'Giacomo Debidda',
      email: 'giacomo@giacomodebidda.com'
    }
  })

  fastify.register(micropub, {
    baseUrl: base_url,
    clientId: client_id,
    cloudflareAccountId: config.cloudflare_account_id,
    cloudflareR2AccessKeyId: config.cloudflare_r2_access_key_id,
    cloudflareR2BucketName: config.cloudflare_r2_bucket_name,
    cloudflareR2SecretAccessKey: config.cloudflare_r2_secret_access_key,
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

  return fastify
}
