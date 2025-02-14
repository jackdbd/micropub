import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

export const NAME = 'micropub-endpoint'

const defaults = {}

const micropubEndpoint: FastifyPluginCallback = (fastify, options, done) => {
  const config = Object.assign({}, defaults, options)
  console.log(`${NAME} config`, config)

  fastify.register(formbody)

  fastify.register(multipart, {
    attachFieldsToBody: 'keyValues'
  })

  fastify.post('/micropub', function (request, reply) {
    console.log('=== /micropub request.headers ===', request.headers)
    console.log('=== /micropub request.body ===', request.body)
    return reply.send({ message: 'fake micropub response' })
  })

  done()
}

export default fp(micropubEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
