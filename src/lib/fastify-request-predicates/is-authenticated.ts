import type { FastifyRequest } from 'fastify'
import { unixTimestampInSeconds } from '../date.js'
import type { IsAccessTokenBlacklisted } from '../schemas/index.js'

export interface Config {
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  logPrefix: string
}

// TODO: at the moment this works only if I authenticate with IndieAuth.
// If I authenticate with another authention provider (e.g. GitHub), the logic
// is a bit different and I cannot call my isBlacklisted function.

export const defIsAuthenticated = (config: Config) => {
  const { isAccessTokenBlacklisted } = config
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
    const { error, value: blacklisted } = await isAccessTokenBlacklisted(
      claims.jti
    )

    if (error) {
      const error_description = error.message
      // throw new ServerError({ error_description })
      request.log.error(`${log_refix}${error_description}`)
      return false
    }

    if (blacklisted) {
      const error_description = `Token ${claims.jti} is blacklisted.`
      //   throw new InvalidTokenError({ error_description })
      request.log.warn(`${log_refix}${error_description}`)
      return false
    }

    return true
  }
}
