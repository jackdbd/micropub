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
import { PinoLoggerOptions } from 'fastify/types/logger.js'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import youch from './plugins/youch/index.js'
import errorHandler from './plugins/error-handler/index.js'
import indieauth from './plugins/indieauth/index.js'
import micropub from './plugins/micropub/index.js'
import introspectionEndpoint from './plugins/introspect-endpoint/index.js'
import revocationEndpoint from './plugins/revocation-endpoint/index.js'
import userinfoEndpoint from './plugins/userinfo-endpoint/index.js'
import tokenEndpoint from './plugins/token-endpoint/index.js'
import { tap } from './nunjucks/filters.js'
import { foo } from './nunjucks/globals.js'

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

export interface Config {
  base_url: string
  cloudflare_account_id: string
  cloudflare_r2_access_key_id: string
  cloudflare_r2_bucket_name: string
  cloudflare_r2_secret_access_key: string
  logger: PinoLoggerOptions
  report_all_ajv_errors: boolean
  use_development_error_handler: boolean
  use_secure_flag_for_session_cookie: boolean
}

/**
 * Instantiates the Fastify app.
 */
export function defFastify(config: Config) {
  const {
    base_url,
    logger,
    report_all_ajv_errors,
    use_development_error_handler,
    use_secure_flag_for_session_cookie
  } = config

  const fastify = Fastify({ logger })

  fastify.register(sensible)

  fastify.register(multipart)

  // plugin to parse x-www-form-urlencoded bodies
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

  const sessionName = 'session'
  const expiry = 60 * 60 // in seconds

  const key_one_buf = process.env.SECURE_SESSION_KEY_ONE
  if (!key_one_buf) {
    // This is a configuration error, so I wouldn't use something like fastify.httpErrors
    throw new Error('SECURE_SESSION_KEY_ONE not set')
  }

  const key_two_buf = process.env.SECURE_SESSION_KEY_TWO
  if (!key_two_buf) {
    throw new Error('SECURE_SESSION_KEY_TWO not set')
  }

  fastify.register(secureSession, {
    key: [Buffer.from(key_one_buf, 'hex'), Buffer.from(key_two_buf, 'hex')],
    sessionName,
    expiry,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: use_secure_flag_for_session_cookie
    }
  })
  fastify.log.debug(
    {
      sessionName,
      expiry
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
    fastify.register(errorHandler)
  }

  const issuer = base_url

  fastify.register(tokenEndpoint, {
    algorithm: 'HS256',
    baseUrl: base_url,
    expiration: '1 hour',
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
  // const cloudflare_account_id = '43f9884041661b778e95a26992850715'
  // const media_endpoint = `https://${cloudflare_account_id}.r2.cloudflarestorage.com/media`
  const media_endpoint = `https://content.giacomodebidda.com/media`
  const submit_endpoint = `${base_url}/submit`
  const syndicate_to = [
    {
      uid: 'https://fosstodon.org/@jackdbd',
      name: 'jackdbd on Mastodon',
      service: {
        name: 'Mastodon',
        url: 'https://fosstodon.org/'
        // photo: 'https://myfavoritesocialnetwork.example/img/icon.png'
      },
      user: {
        name: 'jackdbd',
        url: 'https://fosstodon.org/@jackdbd',
        photo:
          'https://cdn.fosstodon.org/accounts/avatars/109/632/759/548/530/989/original/7662659b2847db84.jpeg'
      }
    }
  ]

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
    submitEndpoint: submit_endpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint: token_endpoint
  })

  fastify.register(view, {
    engine: { nunjucks },
    templates: [path.join(__dirname, 'templates')],
    options: {
      onConfigure: (env: Environment) => {
        env.addGlobal('foo', foo)
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
