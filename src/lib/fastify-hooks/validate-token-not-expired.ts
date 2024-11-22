import type { onRequestHookHandler } from 'fastify'
import { decode, isExpired } from '../token.js'
import { invalid_token } from './errors.js'
import { authorizationHeaderToToken } from './utils.js'

export interface Config {
  prefix: string
}

export const defValidateAccessTokenNotExpired = (config: Config) => {
  const { prefix } = config

  const validateAccessTokenNotExpired: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    const { error, value: jwt } = authorizationHeaderToToken(
      request.headers.authorization
    )

    if (error) {
      const message = error.message
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const payload = decode({ jwt })

    const expired = isExpired({ exp: payload.exp })

    if (expired) {
      const message = `access token has expired`
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    done()
  }

  return validateAccessTokenNotExpired
}
