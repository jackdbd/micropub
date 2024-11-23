import type { onRequestHookHandler } from 'fastify'
import { isBlacklisted } from '../token.js'
import { invalidToken } from '../micropub/error-responses.js'
import { authorizationHeaderToToken } from './utils.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
}

export const defValidateAccessTokenNotBlacklisted = (options?: Options) => {
  const opt = options || {}
  const include_error_description = opt.include_error_description || false
  const log_prefix = opt.log_prefix

  const validateAccessTokenNotBlacklisted: onRequestHookHandler = async (
    request,
    reply
  ) => {
    const { error, value: jwt } = authorizationHeaderToToken(
      request.headers.authorization
    )

    if (error) {
      const error_description = error.message
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.code(code).send(body)
    }

    const blacklisted = await isBlacklisted({ jwt })
    if (blacklisted) {
      const error_description = 'access token is blacklisted'
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.code(code).send(body)
    }
  }

  return validateAccessTokenNotBlacklisted
}
