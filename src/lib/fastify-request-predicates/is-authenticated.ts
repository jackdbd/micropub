import type { IsAccessTokenRevoked } from '@jackdbd/fastify-token-endpoint'
import type { FastifyRequest } from 'fastify'
import { unixTimestampInSeconds } from '../date.js'

export interface Config {
  isAccessTokenRevoked: IsAccessTokenRevoked
  logPrefix: string
}

// TODO: at the moment this works only if I authenticate with IndieAuth.
// If I authenticate with another authention provider (e.g. GitHub), the logic
// is a bit different and I cannot call my isAccessTokenRevoked function.

export const defIsAuthenticated = (config: Config) => {
  const { isAccessTokenRevoked } = config
  const log_refix = config.logPrefix ?? 'is-authenticated? '

  return async function (request: FastifyRequest) {
    request.log.debug(`${log_refix}checking claims in session`)
    const claims = request.session.get('claims')
    if (!claims) {
      return false
    }

    const exp = claims.exp
    request.log.debug(`${log_refix}checking if claim 'exp' exists`)
    if (!exp) {
      return false
    }

    const now = unixTimestampInSeconds()
    request.log.debug(`${log_refix}checking if claim 'exp' is not expired`)
    if (exp < now) {
      return false
    }

    request.log.debug(
      `${log_refix}checking if jti '${claims.jti}' is blacklisted`
    )
    let revoked = false
    try {
      revoked = await isAccessTokenRevoked(claims.jti)
    } catch (ex: any) {
      const error_description = ex.message
      // throw new ServerError({ error_description })
      request.log.error(`${log_refix}${error_description}`)
      return false
    }

    if (revoked) {
      const error_description = `Token ${claims.jti} is revoked.`
      //   throw new InvalidTokenError({ error_description })
      request.log.warn(`${log_refix}${error_description}`)
      return false
    }

    return true
  }
}
