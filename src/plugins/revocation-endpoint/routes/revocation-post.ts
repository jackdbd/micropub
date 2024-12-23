import assert from 'node:assert'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  secondsToUTCString,
  unixTimestampInSeconds
} from '../../../lib/date.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import type { RevokeJWT } from '../../../lib/schemas/index.js'
import { safeDecode } from '../../../lib/token/decode.js'

interface RequestBody {
  token: string
  token_type_hint?: 'access_token' | 'refresh_token'
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

interface Config {
  log_prefix: string
  me: string
  revokeJWT: RevokeJWT
}

/**
 * Revokes an access token or a refresh token.
 *
 * @see [Token revocation - IndieAuth spec](https://indieauth.spec.indieweb.org/#token-revocation)
 */
export const defRevocationPost = (config: Config) => {
  const { me, log_prefix, revokeJWT } = config

  const revocationPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      return reply.badRequest('missing request body')
    }

    const { token, token_type_hint } = request.body

    if (!token) {
      const error_description = 'No `token` in request body.'
      throw new InvalidRequestError({ error_description })
    }

    // TODO: allow to revoke refresh tokens
    // Clients MAY pass this parameter in order to help the authorization server
    // to optimize the token lookup. If the server is unable to locate the token
    // using the given hint, it MUST extend its search across all of its
    // supported token types.
    // https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
    if (token_type_hint === 'refresh_token') {
      const error_description = `Revoking refresh tokens is not supported by this revocation endpoint.`
      throw new InvalidRequestError({ error_description })
    }

    // As described in [RFC7009], the revocation endpoint responds with HTTP 200
    // for both the case where the token was successfully revoked, or if the
    // submitted token was invalid. I guess an expired token counts as invalid.
    // https://www.rfc-editor.org/rfc/rfc7009.html#section-2.2
    // request.log.warn(`${log_prefix}decode token: ${token} `)
    const { error: error_decode, value: claims } = await safeDecode(token)

    if (error_decode) {
      const summary = `Nothing to revoke, since the token is invalid.`
      request.log.debug(`${log_prefix}${summary} ${error_decode.message}`)

      return reply.successResponse(200, {
        title: 'Success',
        description: 'Token revoke success page',
        summary
      })
    }

    if (!claims.exp) {
      const error_description =
        'Cannot revoke token because it has no `exp` claim.'
      throw new InvalidRequestError({ error_description })
    }

    const unix_now = unixTimestampInSeconds()
    if (claims.exp < unix_now) {
      const exp = secondsToUTCString(claims.exp)
      const now = secondsToUTCString(unix_now)
      const summary = `Nothing to revoke, since the token expired at ${exp} (now is ${now}).`
      request.log.debug(`${log_prefix}${summary}`)

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
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(
      `${log_prefix}try revoking token ${claims.jti} (token_type_hint: ${token_type_hint})`
    )
    const { error: revoke_error, value: revoke_value } = await revokeJWT(token)

    // The revocation itself can fail, and if it's not the client's fault, it
    // does not make sense to return a 4xx. A generic server error is more
    // appropriate.
    if (revoke_error) {
      const original = revoke_error.message
      const error_description = `Cannot revoke token: ${original}`
      throw new ServerError({ error_description })
    }

    const { jti, message } = revoke_value
    assert.strictEqual(jti, claims.jti)

    if (message) {
      request.log.debug(`${log_prefix}${message}`)
    } else {
      request.log.debug(`${log_prefix}token ${jti} revoked`)
    }

    return reply.successResponse(200, {
      title: 'Success',
      description: 'Token revoke success page',
      summary: `Token ${jti} is revoked.`
    })
  }

  return revocationPost
}
