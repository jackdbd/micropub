import type { onRequestHookHandler } from 'fastify'
import type { Claims } from './interfaces.js'
import { insufficientScope, unauthorized } from '../micropub/error-responses.js'

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

  const validateScope: onRequestHookHandler = (request, reply, done) => {
    // If this hook has no scope to check, then it's basically a NOP.
    if (!scope) {
      return done()
    }

    // Consider passing this getter as a configuration option. For example, one
    // might prefer storing/retrieving the claims from a session cookie.
    // The type definition should be: () => Claims | undefined
    const claims = request.requestContext.get('access_token_claims') as
      | Claims
      | undefined

    if (!claims) {
      const error_description = `request context has no access token claims`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.micropubErrorResponse(code, body)
    }

    const scopes = (claims.scope as string).split(' ')
    request.log.debug(`${log_prefix} access token scopes: ${scopes.join(' ')}`)

    // The Micropub server MUST require the bearer token to include at least one
    // scope value, in order to ensure posts cannot be created by arbitrary tokens.
    // https://micropub.spec.indieweb.org/#scope-p-1
    if (scopes.length < 1) {
      const error_description = `access token has no scopes`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = insufficientScope({
        error_description,
        include_error_description
      })

      return reply.micropubErrorResponse(code, body)
    }

    if (!scopes.includes(scope)) {
      const error_description = `access token does not include scope '${scope}'`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = insufficientScope({
        error_description,
        include_error_description
      })

      return reply.micropubErrorResponse(code, body)
    }

    return done()
  }

  return validateScope
}
