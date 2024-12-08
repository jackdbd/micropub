import type { onRequestHookHandler } from 'fastify'
import {
  forbidden,
  invalidRequest,
  unauthorized
} from '../../micropub/error-responses.js'
import type { Assertion, Value } from './interfaces.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX
} from './constants.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
}

export const defValidateClaim = (assertion: Assertion, options?: Options) => {
  const opt = options ?? {}
  const include_error_description =
    opt.include_error_description ?? DEFAULT_INCLUDE_ERROR_DESCRIPTION
  const prefix = opt.log_prefix ?? DEFAULT_LOG_PREFIX

  const validateClaim: onRequestHookHandler = (request, reply, done) => {
    const claims = request.session.get('claims')

    if (!claims) {
      const error_description = `request context has no access token claims`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const key = assertion.claim

    if (!assertion.op && !assertion.value) {
      if (!claims[key]) {
        const error_description = `request context has no claim '${key}'`
        request.log.warn(`${prefix}${error_description}`)

        const { code, body } = unauthorized({
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, body)
      } else {
        return done()
      }
    }

    const op = assertion.op || '=='
    const actual = claims[key] as string | number | boolean

    let given: Value
    if (typeof assertion.value === 'function') {
      request.log.debug(
        `${prefix}the value provided for validating claim '${key}' is a function. Invoking it now.`
      )
      given = assertion.value()
    } else {
      given = assertion.value
    }
    request.log.debug(
      `${prefix}validate claim '${key}': ${actual} ${op} ${given}`
    )

    if (given === undefined) {
      const error_description = `Invalid assertion on claim '${key}'. The value given for the assertion is (or resolved to) undefined.`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // I think HTTP 403 Forbidden is the right status code to use here.
    // https://micropub.spec.indieweb.org/#error-response

    switch (op) {
      case '==': {
        if (actual !== given) {
          const error_description = `claim '${key}' is '${actual}', but it should be '${given}'`
          request.log.warn(`${prefix}${error_description}`)

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
          request.log.warn(`${prefix}${error_description}`)

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
          request.log.warn(`${prefix}${error_description}`)

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
          request.log.warn(`${prefix}${error_description}`)

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
          request.log.warn(`${prefix}${error_description}`)

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
          request.log.warn(`${prefix}${error_description}`)

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
        request.log.warn(`${prefix}${message}`)
        return done()
      }
    }
  }

  return validateClaim
}
