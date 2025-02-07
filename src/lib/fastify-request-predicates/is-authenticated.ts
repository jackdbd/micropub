import { isExpired, msToUTCString } from '@jackdbd/indieauth'
import type { IsAccessTokenRevoked } from '@jackdbd/indieauth/schemas/user-provided-functions'
import type { FastifyRequest } from 'fastify'

export interface Config {
  isAccessTokenRevoked: IsAccessTokenRevoked
  logPrefix: string
}

// TODO: at the moment this works only if I authenticate with IndieAuth.
// If I authenticate with another authention provider (e.g. GitHub), the logic
// is a bit different and I cannot call my isAccessTokenRevoked function.

export const defIsAuthenticated = (config: Config) => {
  const { isAccessTokenRevoked } = config
  const log_prefix = config.logPrefix ?? 'is-authenticated? '

  return async function (request: FastifyRequest) {
    request.log.debug(`${log_prefix}get access token claims from session`)
    const claims = request.session.get('claims')
    if (!claims) {
      return false
    }

    const { exp, iat, iss, jti } = claims
    if (!exp) {
      return false
    }

    const iat_utc = msToUTCString(iat * 1000)
    const exp_utc = msToUTCString(exp * 1000)

    request.log.debug(
      `access token issued by ${iss} at UNIX timestamp ${iat} (${iat_utc})`
    )

    const expired = isExpired(exp)
    if (expired) {
      request.log.debug(
        `${log_prefix}access token expired at UNIX timestamp ${exp} (${exp_utc})`
      )
    } else {
      request.log.debug(
        `${log_prefix}access token will expire at UNIX timestamp ${exp} (${exp_utc})`
      )
    }

    request.log.debug(`${log_prefix}checking if jti '${jti}' is revoked`)
    let revoked = false
    try {
      revoked = await isAccessTokenRevoked(jti)
    } catch (ex: any) {
      const error_description = ex.message
      // throw new ServerError({ error_description })
      request.log.error(`${log_prefix}${error_description}`)
      return false
    }

    if (revoked) {
      const error_description = `Access Token jti=${jti} is revoked.`
      //   throw new InvalidTokenError({ error_description })
      request.log.warn(`${log_prefix}${error_description}`)
      return false
    }

    return true
  }
}
