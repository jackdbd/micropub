import type { onRequestHookHandler } from 'fastify'
import { msToUTCString } from '../date.js'
import { decode, isExpired } from '../token.js'
import { invalid_token } from './errors.js'

export interface ValidateAccessTokenConfig {
  me: string
  prefix: string
}

// TODO: make this function much more granular. It should be able to check
// individual scopes, so that a token that is not expired, not blacklisted, that
// has a matching `me` claim, BUT that has insufficient scopes for the action
// requested by the user should return HTTP 403.

export const defValidateMeClaimInAccessToken = (
  config: ValidateAccessTokenConfig
) => {
  const { me, prefix } = config

  const validateMeClaimInAccessToken: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    const auth = request.headers.authorization

    if (!auth) {
      const message = 'missing Authorization header'
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.micropubUnauthorized(message)
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      const message = `no value for 'Bearer' in Authorization header`
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.debug(`${prefix} access token scopes: ${scopes.join(' ')}`)

    if (claims.me !== me) {
      const message = `access token has a 'me' claim which is not ${me}`
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims. Point to the relevant
    // documentation of various token endpoints (e.g. this app, IndieLogin.com).
    const iat_utc = msToUTCString(claims.iat * 1000)
    const exp_utc = msToUTCString(claims.exp * 1000)

    const messages = [
      `access token issued by ${claims.iss} at UNIX timestamp ${claims.iat} (${iat_utc})`
    ]

    const expired = isExpired({ exp: claims.exp })
    if (expired) {
      messages.push(`expired at UNIX timestamp ${claims.exp} (${exp_utc})`)
    } else {
      messages.push(`will expire at UNIX timestamp ${claims.exp} (${exp_utc})`)
    }

    request.log.info(`${prefix} ${messages.join('; ')} `)

    done()
  }

  return validateMeClaimInAccessToken
}
