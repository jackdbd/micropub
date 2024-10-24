import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'
import formbody from '@fastify/formbody'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import youch from './plugins/youch/index.js'
import productionErrorHandler from './plugins/production-error-handler/index.js'
import micropub from './plugins/micropub/index.js'
import authorizationEndpoint from './plugins/authorization-endpoint/index.js'
import revocationEndpoint from './plugins/revocation-endpoint/index.js'
import tokenEndpoint from './plugins/token-endpoint/index.js'
import { tap } from './nunjucks/filters.js'
import { foo } from './nunjucks/globals.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type Level = 'debug' | 'info' | 'warn' | 'error'

export interface Options {
  logger?: { level?: Level; transport?: any }
}

/**
 * Instantiates the Fastify app.
 */
export async function defFastify(options?: Options) {
  const fastify = Fastify(options)

  // plugin to parse x-www-form-urlencoded bodies
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

  const ssk = path.join(__dirname, '..', 'secrets', 'secure-session-key')
  const sessionName = 'session'
  const expiry = 60 * 60 // in seconds

  fastify.register(secureSession, {
    key: fs.readFileSync(ssk),
    sessionName,
    expiry,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  })
  fastify.log.debug(
    {
      secret: ssk,
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

  if (process.env.NODE_ENV === 'development') {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(productionErrorHandler)
  }

  const me = 'https://giacomodebidda.com/'
  const client_id = 'https://indieauth.com'
  // const redirectUri = 'https://indieauth.com/success'
  const redirect_uri = process.env.BASE_URL! + '/callback'
  const authorization_endpoint = 'https://indieauth.com/auth'
  const token_endpoint = process.env.BASE_URL! + '/token'
  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const issuer = process.env.BASE_URL!

  fastify.register(micropub, {
    authorizationEndpoint: authorization_endpoint,
    clientId: client_id,
    tokenEndpoint: token_endpoint,
    redirectUri: redirect_uri,
    me
  })

  fastify.register(authorizationEndpoint, {
    clientId: client_id,
    endpoint: authorization_endpoint,
    redirectUri: redirect_uri,
    tokenEndpoint: token_endpoint
  })

  fastify.register(tokenEndpoint, {
    algorithm: 'HS256',
    me,
    endpoint: token_endpoint,
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
      name: 'Giacomo'
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
