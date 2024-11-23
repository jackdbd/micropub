import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { INVALID_REQUEST, INVALID_TOKEN } from '../../lib/http-error.js'
import { isExpired, isBlacklisted, safeDecode } from '../../lib/token.js'
import { NAME } from './constants.js'

const PREFIX = `${NAME}/routes `

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
      const error_description = 'missing request body'
      request.log.warn(`${PREFIX}${error_description}`)

      return reply
        .code(INVALID_REQUEST.code)
        .send({ error: INVALID_REQUEST.error, error_description })
    }

    const { token } = request.body

    if (!token) {
      const error_description = 'The `token` parameter is missing'
      request.log.warn(`${PREFIX}${error_description}`)

      return reply
        .code(INVALID_TOKEN.code)
        .send({ error: INVALID_TOKEN.error, error_description })
    }

    const blacklisted = await isBlacklisted({ jwt: token })
    // Should I tell the client that the token is expired or blacklisted?
    // Probably not.
    // Should I log whether the token is expired or blacklisted?
    // Probably yes.

    const result = await safeDecode(token)

    if (result.error) {
      const error_description = result.error.message
      request.log.warn(`${PREFIX}${error_description}`)

      // support content-type JSON and HTML

      return reply.code(INVALID_TOKEN.code).send({
        error: INVALID_TOKEN.error,
        error_description
      })
    } else {
      const claims = result.value
      const expired = isExpired({ exp: claims.exp })

      // Should this be a boolean or a string? From the specs it seems it should
      // be a string...
      const active = !expired && !blacklisted ? 'true' : 'false'

      return reply.send({
        ...claims,
        active,
        client_id
      })
    }
  }

  return introspect
}
