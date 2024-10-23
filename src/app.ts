import Fastify from 'fastify'
import formbody from '@fastify/formbody'
import youch from './plugins/youch/index.js'
import productionErrorHandler from './plugins/production-error-handler/index.js'
import micropub from './plugins/micropub/index.js'

export type Level = 'debug' | 'info' | 'warn' | 'error'

export interface Options {
  logger: { level: Level; transport: any }
}

/**
 * Instantiates the Fastify app.
 */
export async function build(
  opts: Options = { logger: { level: 'info', transport: undefined } }
) {
  const fastify = Fastify(opts)

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

  fastify.get('/', async (_request, reply) => {
    reply.send({ hello: 'world' })
  })

  fastify.get('/error', async (_request, _reply) => {
    throw new Error('Some weird error')
  })

  return fastify
}
