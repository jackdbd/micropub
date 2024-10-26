import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'
import formbody from '@fastify/formbody'
import { PinoLoggerOptions } from 'fastify/types/logger.js'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import youch from './plugins/youch/index.js'
import errorHandler from './plugins/error-handler/index.js'
import micropub from './plugins/micropub/index.js'
import authorizationEndpoint from './plugins/authorization-endpoint/index.js'
import revocationEndpoint from './plugins/revocation-endpoint/index.js'
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

  // plugin to parse x-www-form-urlencoded bodies
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

  const sessionName = 'session'
  const expiry = 60 * 60 // in seconds

  const key_one_buf = process.env.SECURE_SESSION_KEY_ONE
  if (!key_one_buf) {
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

  const me = 'https://giacomodebidda.com/'
  const client_id = 'https://indieauth.com'
  // const redirectUri = 'https://indieauth.com/success'
  const redirect_uri = `${base_url}/callback`

  const authorization_endpoint = 'https://indieauth.com/auth'
  const token_endpoint = `${base_url}/token`
  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const micropub_endpoint = `${base_url}/micropub`
  const submit_endpoint = `${base_url}/submit`

  const issuer = base_url

  fastify.register(micropub, {
    authorizationEndpoint: authorization_endpoint,
    clientId: client_id,
    me,
    micropubEndpoint: micropub_endpoint,
    redirectUri: redirect_uri,
    reportAllAjvErrors: report_all_ajv_errors,
    submitEndpoint: submit_endpoint,
    tokenEndpoint: token_endpoint
  })

  fastify.register(authorizationEndpoint, {
    clientId: client_id,
    redirectUri: redirect_uri,
    tokenEndpoint: token_endpoint
  })

  fastify.register(tokenEndpoint, {
    algorithm: 'HS256',
    authorizationEndpoint: authorization_endpoint,
    expiration: '1 hour',
    issuer
  })

  fastify.register(revocationEndpoint, {})

  fastify.register(fastifyView, {
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

  fastify.get('/error', async (request, reply) => {
    const message = (request.query as any).message

    if (message) {
      return reply.view('error.njk', {
        description: 'Error page',
        title: 'Error',
        message
      })
    } else {
      throw new Error('Some unexpected error')
    }
  })

  return fastify
}
