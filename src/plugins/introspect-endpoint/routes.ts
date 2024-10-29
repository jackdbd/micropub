import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { decode, isExpired, isBlacklisted } from '../../lib/token.js'

export interface IntrospectConfig {
  client_id: string
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
  const { client_id } = config

  const introspect: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      return reply.badRequest('missing request body')
    }

    const { token } = request.body
    // https://indieauth.spec.indieweb.org/#error-responses
    if (!token) {
      return reply.code(401).send({
        error: 'invalid_token',
        error_description: 'The `token` parameter is missing.'
      })
    }

    const payload = decode({ jwt: token })

    const expired = isExpired({ exp: payload.exp })
    const blacklisted = await isBlacklisted({ jwt: token })
    // Should I tell the client that the token is expired or blacklisted?
    // Probably not.
    // Should I log whether the token is expired or blacklisted?
    // Probably yes.

    // Should this be a boolean or a string? From the specs it seems it should
    // be a string...
    const active = !expired && !blacklisted ? 'true' : 'false'

    return reply.send({
      ...payload,
      active,
      client_id
    })
  }

  return introspect
}
