import Fastify from 'fastify'
import {
  FastifyInstance,
  FastifyPluginOptions,
  DoneFuncWithErrOrRes
} from 'fastify'
import fp from 'fastify-plugin'

const EMOJI = '🔍'
const NAME = 'fastify-production-error-handler'
const PREFIX = `[${EMOJI} ${NAME}]`

const fastifyProductionErrorHandler = (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: DoneFuncWithErrOrRes
) => {
  fastify.log.debug(`${PREFIX} config ${JSON.stringify(opts, null, 2)}}`)

  fastify.setErrorHandler(function (error, request, reply) {
    const status = error.statusCode || request.raw.statusCode || 500

    // console.log('🚀 ~ request content-type', request.headers['content-type'])
    // console.log('🚀 ~ error:', error)

    request.log.error(error.message)

    // reply.status(status).send({
    //   ok: false,
    //   message: 'There was an error processing your request.'
    // })

    if (error instanceof Fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
      //   fastify.log.error(error)
      request.log.error(error.message)

      reply.status(status).send({
        ok: false,
        message: 'There was an error processing your request!'
      })
    } else {
      // fastify will use parent error handler to handle this
      reply.send(error)
    }
  })

  fastify.log.debug(`${PREFIX} registered`)
  done()
}

export default fp(fastifyProductionErrorHandler, {
  fastify: '^4.x.x',
  name: NAME
})
