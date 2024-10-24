import Fastify from 'fastify'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

const EMOJI = '🔍'
const NAME = '@jackdbd/fastify-production-error-handler'
const PREFIX = `[${EMOJI} ${NAME}]`

export interface PluginOptions extends FastifyPluginOptions {
  // Not defined at the moment. Used just to show how to define plugin options.
  verbose?: boolean
}

const fastifyProductionErrorHandler: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  fastify.log.debug(`${PREFIX} config ${JSON.stringify(options, null, 2)}}`)

  // TODO: use something like Sentry, or GCP Error Reporting, or port to Fastify this Hapi plugin.
  // https://github.com/jackdbd/matsuri/tree/main/packages/hapi-github-issue-plugin

  fastify.setErrorHandler(function (error, request, reply) {
    const status = error.statusCode || request.raw.statusCode || 500

    request.log.error(error.message)

    if (error instanceof Fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
      reply.status(status).send({
        ok: false,
        message: 'There was an error processing your request!'
      })
    } else {
      // fastify will use parent error handler to handle this
      reply.send(error)
    }
  })

  fastify.log.info(`${PREFIX} registered`)
  done()
}

export default fp<PluginOptions>(fastifyProductionErrorHandler, {
  fastify: '>=4.0.0 <6.0.0',
  name: NAME
})
