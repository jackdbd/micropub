import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyView from '@fastify/view'
import formbody from '@fastify/formbody'
// @ts-ignore-next-line
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import youch from './plugins/youch/index.js'
import productionErrorHandler from './plugins/production-error-handler/index.js'
import micropub from './plugins/micropub/index.js'
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

  if (process.env.NODE_ENV === 'development') {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(productionErrorHandler)
  }

  fastify.register(micropub, {
    // authorizationEndpoint: '',
    // tokenEndpoint: '',
    // Not sure if I have to include www in `me`
    me: 'https://www.giacomodebidda.com/'
    // me: 'https://giacomodebidda.com/'
  })

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

  fastify.get('/auth', async (_request, reply) => {
    return reply.view('auth.njk', {
      description: 'Authorization page',
      title: 'Authorization'
    })
  })

  fastify.get('/error', async (_request, _reply) => {
    throw new Error('Some weird error')
  })

  fastify.get('/token', async (_request, reply) => {
    return reply.view('token.njk', {
      description: 'Token page',
      title: 'Token'
    })
  })

  return fastify
}
