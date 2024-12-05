import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { invalidRequest, invalidToken } from '../../../lib/micropub/index.js'
import { safeDecode } from '../../../lib/token/decode.js'
import { isExpired, isBlacklisted } from '../../../lib/token/utils.js'
import { NAME } from '../constants.js'

const PREFIX = `${NAME}/routes `

export interface IntrospectConfig {
  client_id: string
  include_error_description: boolean
}

interface RequestBody {
  token: string
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

/**
 * https://indieauth.spec.indieweb.org/#access-token-verification
 */
export const defIntrospect = (config: IntrospectConfig) => {
  const { client_id, include_error_description } = config

  const introspect: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      const error_description = 'Request has no body'
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        description: 'Introspection endpoint error page',
        title: 'Invalid request'
      })
    }

    const { token } = request.body

    if (!token) {
      const error_description = 'The `token` parameter is missing'
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Invalid token',
        description: 'Introspection endpoint error page'
      })
    }

    request.log.warn(`TODO: query token store to see if JWT is blacklisted`)
    const blacklisted = await isBlacklisted({ jwt: token })
    // Should I tell the client that the token has expired or has been
    // blacklisted? Probably not.
    // Should I log whether the token is expired or blacklisted? Probably yes.

    const result = await safeDecode(token)

    if (result.error) {
      const error_description = result.error.message
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Invalid token',
        description: 'Introspection endpoint error page'
      })
    } else {
      const claims = result.value
      const expired = isExpired({ exp: claims.exp })

      // Should this be a boolean or a string? From the specs it seems it should
      // be a string...
      const active = !expired && !blacklisted ? 'true' : 'false'

      return reply.successResponse(200, {
        title: 'Token introspection',
        summary: `Client ID: ${client_id} (Active: ${active})`,
        payload: claims
      })
    }
  }

  return introspect
}
