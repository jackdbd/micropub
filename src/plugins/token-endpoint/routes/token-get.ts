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
    const access_token = request.session.get('access_token')

    if (!access_token) {
      // Should we mention the session key we are using to store the access
      // token? Can this be a security risk?
      // const error_description = `Access token not found in session key 'access_token'.`
      const error_description = `Access token not found in session.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}access token extracted from session`)

    const { error, value: claims } = await safeDecode(access_token)

    if (error) {
      const error_description = `failed to decode access token: ${error.message}`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(claims, `${log_prefix}claims decoded from access token`)

    const refresh_token = request.session.get('refresh_token')

    return reply.successResponse(200, {
      title: 'Token',
      description: 'Token endpoint success page',
      summary: 'The current session contains this access token.',
      payload: { access_token, claims, refresh_token }
    })
  }

  return tokenGet
}
