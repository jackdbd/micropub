import { requestContext } from '@fastify/request-context'
import { send } from '@jackdbd/notifications/telegram'
import { errorText } from '@jackdbd/telegram-text-messages/error'
import Fastify from 'fastify'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { NAME } from './constants.js'

export interface PluginOptions extends FastifyPluginOptions {
  telegram?: { chat_id: string; token: string }
}

const errorHandler: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  fastify.log.debug(options, `${NAME} options`)

  // TODO: use something like Sentry, or GCP Error Reporting, or port to Fastify this Hapi plugin.
  // https://github.com/jackdbd/matsuri/tree/main/packages/hapi-github-issue-plugin

  fastify.setErrorHandler(async function (error, request, reply) {
    const status = error.statusCode || request.raw.statusCode || 500

    const access_token_claims = requestContext.get('access_token_claims')
    const jf2 = requestContext.get('jf2')

    const error_title = error.name || 'Error'

    const obj = {
      access_token_claims,
      error_message: error.message,
      error_validation: error.validation,
      error_validationContext: error.validationContext,
      jf2,
      request_host: request.host,
      request_method: request.method,
      request_url: request.url
    }

    if (options.telegram) {
      const text = errorText({
        app_name: 'Micropub',
        app_version: '0.0.1',
        error_message: JSON.stringify(obj, null, 2),
        error_title,
        links: [
          {
            href: 'https://fly.io/apps/micropub/monitoring',
            text: 'Fly Live logs'
          }
        ]
      })

      const { chat_id, token } = options.telegram

      const result = await send(
        { chat_id, token, text },
        { disable_notification: false, disable_web_page_preview: true }
      )

      if (result.delivered) {
        request.log.info(result.message)
      } else {
        request.log.warn(result.message)
      }
    }

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

  done()
}

export default fp<PluginOptions>(errorHandler, {
  fastify: '5.x',
  name: NAME
})
