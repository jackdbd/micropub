import type { onRequestHookHandler } from 'fastify'
import { unauthorized } from '../micropub/error-responses.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
}

export const defValidateAuthorizationHeader = (options?: Options) => {
  const opt = options || {}
  const include_error_description = opt.include_error_description || false
  const log_prefix = opt.log_prefix || ''

  const validateAuthorizationHeader: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    const auth = request.headers.authorization

    if (!auth) {
      const error_description = `request has no Authorization header`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.code(code).send(body)
    }

    if (auth.indexOf('Bearer') === -1) {
      const error_description = `request has no 'Bearer' in Authorization header`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.code(code).send(body)
    }

    done()
  }

  return validateAuthorizationHeader
}
