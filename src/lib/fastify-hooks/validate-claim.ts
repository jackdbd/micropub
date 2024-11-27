import type { onRequestHookHandler } from 'fastify'
import { forbidden, unauthorized } from '../micropub/error-responses.js'
import type { Assertion, Claims } from './interfaces.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
}

export const defValidateClaim = (assertion: Assertion, options?: Options) => {
  const opt = options || {}
  const include_error_description = opt.include_error_description || false
  const log_prefix = opt.log_prefix || ''

  const validateClaim: onRequestHookHandler = (request, reply, done) => {
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

      return reply.errorResponse(code, body)
    }

    const op = assertion.op || '=='
    const key = assertion.claim
    const actual = claims[key]

    let given
    if (typeof assertion.value === 'function') {
      request.log.debug(
        `${log_prefix}the value provided for validating the claim '${key}' is a function. Invoking it now and test its return value against the actual token claim...`
      )
      given = assertion.value()
    } else {
      given = assertion.value
    }

    // I think HTTP 403 Forbidden is the right status code to use here.
    // https://micropub.spec.indieweb.org/#error-response

    switch (op) {
      case '==': {
        if (actual !== given) {
          const error_description = `claim '${key}' is '${actual}', but it should be '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      case '!=': {
        if (actual === given) {
          const error_description = `claim '${key}' is '${actual}', but it should not be '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      case '<': {
        if (actual >= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      case '<=': {
        if (actual > given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than or equal to '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      case '>': {
        if (actual <= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      case '>=': {
        if (actual < given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than or equal to '${given}'`
          request.log.warn(`${log_prefix}${error_description}`)

          const { code, body } = forbidden({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        } else {
          return done()
        }
      }

      default: {
        const message = `received unknown operation '${assertion.op}' (ignored)`
        request.log.warn(`${log_prefix}${message}`)
        return done()
      }
    }
  }

  return validateClaim
}
