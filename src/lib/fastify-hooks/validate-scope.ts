import type { preHandlerHookHandler } from 'fastify'
import { defErrorIfActionNotAllowed } from '../error-if-action-not-allowed.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
  scope?: string
}

/**
 * Validates that the request context contains a decoded access token that has
 * the expected scope.
 *
 * @see https://micropub.spec.indieweb.org/#scope
 */
export const defValidateScope = (options?: Options) => {
  const opt = options || {}
  const include_error_description = opt.include_error_description || false
  const log_prefix = opt.log_prefix || ''
  const scope = opt.scope

  const errorIfActionNotAllowed = defErrorIfActionNotAllowed({
    include_error_description,
    log_prefix
  })

  const validateScope: preHandlerHookHandler = (request, reply, done) => {
    // If this hook has no scope to check, then it's basically a NOP.
    if (!scope) {
      return done()
    }

    const error = errorIfActionNotAllowed(request, scope)

    if (error) {
      const { code, body } = error
      return reply.errorResponse(code, body)
    }

    return done()
  }

  return validateScope
}
