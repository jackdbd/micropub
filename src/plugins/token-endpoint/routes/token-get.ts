import type { RouteHandler } from 'fastify'
import {
  invalidToken,
  unauthorized
} from '../../../lib/micropub/error-responses.js'
import { safeDecode } from '../../../lib/token/decode.js'

export interface TokenGetConfig {
  include_error_description: boolean
  log_prefix: string
}

export const defTokenGet = (config: TokenGetConfig) => {
  const { include_error_description, log_prefix } = config

  const tokenGet: RouteHandler = async (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      // Should we mention the session key we are using to store the access
      // token? Can this be a security risk?
      // const error_description = `Access token not found in session key 'jwt'.`
      const error_description = `Access token not found in session.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}access token extracted from session`)

    const result = await safeDecode(jwt)

    if (result.error) {
      const error_description = `failed to decode token: ${result.error.message}`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    } else {
      const claims = result.value
      request.log.debug(claims, `${log_prefix}claims decoded from access token`)

      return reply.successResponse(200, {
        title: 'Access token',
        description: 'Token endpoint success page',
        summary: 'The current session contains this access token.',
        payload: { jwt, claims }
      })
    }
  }

  return tokenGet
}
