import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  secondsToUTCString,
  unixTimestampInSeconds
} from '../../../lib/date.js'
import {
  invalidRequest,
  serverError
} from '../../../lib/micropub/error-responses.js'
import type { Revoke } from '../../../lib/schemas/index.js'
import { safeDecode } from '../../../lib/token/decode.js'

interface RequestBody {
  token: string
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

interface Config {
  include_error_description: boolean
  me: string
  prefix: string
  revoke: Revoke
}

/**
 * https://indieauth.spec.indieweb.org/#token-revocation
 */
export const defRevocationPost = (config: Config) => {
  const { include_error_description, me, prefix, revoke } = config

  const revocationPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      return reply.badRequest('missing request body')
    }

    const { token } = request.body

    if (!token) {
      const error_description = 'No `token` in request body.'

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'No token in request body',
        description: 'Revocation endpoint error page'
      })
    }

    // As described in [RFC7009], the revocation endpoint responds with HTTP 200
    // for both the case where the token was successfully revoked, or if the
    // submitted token was invalid. I guess an expired token counts as invalid.
    // https://www.rfc-editor.org/rfc/rfc7009.html#section-2.2
    const { error: error_decode, value: claims } = await safeDecode(token)

    if (error_decode) {
      const summary = `Nothing to revoke, since the token is invalid.`
      request.log.debug(`${prefix}${summary} ${error_decode.message}`)

      return reply.successResponse(200, {
        title: 'Success',
        description: 'Token revoke success page',
        summary
      })
    }

    const unix_now = unixTimestampInSeconds()
    if (claims.exp < unix_now) {
      const exp = secondsToUTCString(claims.exp)
      const now = secondsToUTCString(unix_now)
      const summary = `Nothing to revoke, since the token expired at ${exp} (now is ${now}).`
      request.log.debug(`${prefix}${summary}`)

      return reply.successResponse(200, {
        title: 'Success',
        description: 'Token revoke success page',
        summary
      })
    }

    // I am not sure this should be considered an error, but I I think it would
    // be weird to return HTTP 200 for a JWT that has a different `me` claim.
    if (claims.me !== me) {
      const error_description = `The token has a claim me=${claims.me}. This endpoint can only revoke tokens that have me=${me}`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token revocation failed',
        description: 'Revocation endpoint error page'
      })
    }

    request.log.debug(claims, `${prefix}try revoking token`)
    const result = await revoke(token)

    // The revocation itself can fail, and if it's not the client's fault, it
    // does not make sense to return a 4xx. A generic server error is more
    // appropriate.
    if (result.error) {
      const original = result.error.message
      const error_description = `cannot revoke token: ${original}`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'revoke_failed',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    } else {
      const summary = claims.jti
        ? `Token ${claims.jti} revoked.`
        : `Token revoked.`

      request.log.debug(result.value, `${prefix}${summary}`)

      return reply.successResponse(200, {
        title: 'Success',
        description: 'Token revoke success page',
        summary
      })
    }
  }

  return revocationPost
}
