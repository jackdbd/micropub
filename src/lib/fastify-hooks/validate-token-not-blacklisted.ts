import type { onRequestHookHandler } from 'fastify'
import { isBlacklisted } from '../token.js'
import { invalid_token } from './errors.js'
import { authorizationHeaderToToken } from './utils.js'

export interface Config {
  prefix: string
}

export const defValidateAccessTokenNotBlacklisted = (config: Config) => {
  const { prefix } = config

  const validateAccessTokenNotBlacklisted: onRequestHookHandler = async (
    request,
    reply
  ) => {
    const { error, value: jwt } = authorizationHeaderToToken(
      request.headers.authorization
    )

    if (error) {
      const message = error.message
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const blacklisted = await isBlacklisted({ jwt })
    if (blacklisted) {
      const message = 'access token is blacklisted'
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }
  }

  return validateAccessTokenNotBlacklisted
}
