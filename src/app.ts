import Fastify from 'fastify'
import formbody from '@fastify/formbody'
import youch from './plugins/youch/index.js'
import productionErrorHandler from './plugins/production-error-handler/index.js'
import micropub from './plugins/micropub/index.js'

export type Level = 'info' | 'debug' | 'warn' | 'error'

export interface Options {
  logger: { level: Level; transport: any }
}

export async function build(
  opts: Options = { logger: { level: 'info', transport: undefined } }
) {
  const fastify = Fastify(opts)

  // this plugin allows parses content type application/x-www-form-urlencoded
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(productionErrorHandler)
  }

  fastify.register(micropub, {
    me: 'https://giacomodebidda.com/'
  })

  fastify.get('/', async (_request, reply) => {
    reply.send({ hello: 'world' })
  })

  fastify.get('/error', async (_request, _reply) => {
    throw new Error('Some weird error')
  })

  return fastify
}
