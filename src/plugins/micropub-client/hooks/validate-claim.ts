import type { RequestContextData } from '@fastify/request-context'
import type { Assertion, Value } from '@jackdbd/fastify-hooks/schemas/assertion'
import type { AccessTokenClaims } from '@jackdbd/indieauth'
import {
  InvalidRequestError,
  InvalidTokenError,
  UnauthorizedError
} from '@jackdbd/oauth2-error-responses'
import type { onRequestHookHandler } from 'fastify'

export interface Options {
  logPrefix?: string
  requestContextKey?: string
}

const defaults: Partial<Options> = {
  logPrefix: '[validate-claim] ',
  requestContextKey: 'access_token_claims'
}

export const defValidateClaim = (assertion: Assertion, options?: Options) => {
  const config = Object.assign({}, defaults, options) as Required<Options>

  const ctx_key = config.requestContextKey as keyof RequestContextData

  const { logPrefix } = config

  if (!ctx_key) {
    throw new Error('requestContextKey is required')
  }

  const validateClaim: onRequestHookHandler = (request, _reply, done) => {
    request.log.debug(
      `${logPrefix}get access token claims from request context key '${ctx_key}'`
    )

    const claims = request.requestContext.get(ctx_key) as AccessTokenClaims

    if (!claims) {
      const error_description = `No access token claims in request context, under key '${ctx_key}'`
      throw new UnauthorizedError({ error_description })
    }

    const key = assertion.claim

    if (!assertion.op && !assertion.value) {
      if (!claims[key]) {
        const error_description = `No claim '${key}' in request context, under key '${ctx_key}'`
        throw new UnauthorizedError({ error_description })
      } else {
        return done()
      }
    }

    const op = assertion.op || '=='
    const actual = claims[key] as string | number | boolean

    let given: Value
    if (typeof assertion.value === 'function') {
      request.log.debug(
        `${logPrefix}the value provided for validating claim '${key}' is a function. Invoking it now.`
      )
      given = assertion.value()
    } else {
      given = assertion.value
    }
    request.log.debug(
      `${logPrefix}assert claim '${key}': ${actual} ${op} ${given}`
    )

    if (given === undefined) {
      const error_description = `Invalid assertion on claim '${key}'. The value given for the assertion is (or resolved to) undefined.`
      throw new InvalidRequestError({ error_description })
    }

    // https://micropub.spec.indieweb.org/#error-response
    switch (op) {
      case '==': {
        if (actual !== given) {
          const error_description = `claim '${key}' is '${actual}', but it should be '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      case '!=': {
        if (actual === given) {
          const error_description = `claim '${key}' is '${actual}', but it should not be '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      case '<': {
        if (actual >= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      case '<=': {
        if (actual > given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than or equal to '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      case '>': {
        if (actual <= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      case '>=': {
        if (actual < given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than or equal to '${given}'`
          throw new InvalidTokenError({ error_description })
        } else {
          return done()
        }
      }

      default: {
        const message = `received unknown operation '${assertion.op}' (ignored)`
        request.log.warn(`${logPrefix}${message}`)
        return done()
      }
    }
  }

  return validateClaim
}
