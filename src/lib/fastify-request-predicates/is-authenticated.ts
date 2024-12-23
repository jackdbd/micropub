import type { FastifyRequest } from 'fastify'
import { unixTimestampInSeconds } from '../date.js'
import type { IsBlacklisted } from '../schemas/index.js'

export interface Config {
  isBlacklisted: IsBlacklisted
  logPrefix: string
}

export const defIsAuthenticated = (config: Config) => {
  const { isBlacklisted } = config
  const logPrefix = config.logPrefix ?? 'is-authenticated? '

  return async function (request: FastifyRequest) {
    const claims = request.session.get('claims')
    if (!claims) {
      return false
    }

    const exp = claims.exp
    if (!exp) {
      return false
    }

    const now = unixTimestampInSeconds()
    if (exp < now) {
      return false
    }

    const { error, value: blacklisted } = await isBlacklisted(claims.jti)

    if (error) {
      const error_description = error.message
      // throw new ServerError({ error_description })
      request.log.error(`${logPrefix}${error_description}`)
      return false
    }

    if (blacklisted) {
      const error_description = `Token ${claims.jti} is blacklisted.`
      //   throw new InvalidTokenError({ error_description })
      request.log.warn(`${logPrefix}${error_description}`)
      return false
    }

    return true

    // const access_token = request.session.get('access_token')
  }
}
