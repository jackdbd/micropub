import type { Session, SessionData } from '@fastify/secure-session'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import type { JWTPayload } from 'jose'
import {
  ForbiddenError,
  InvalidRequestError,
  UnauthorizedError
} from '../../fastify-errors/index.js'
import { throwIfDoesNotConform } from '../../validators.js'
import { DEFAULT } from './constants.js'
import {
  options as options_schema,
  type Assertion,
  type Options,
  type Value
} from './schemas.js'

const defaults: Partial<Options> = {
  claimsSessionKey: DEFAULT.CLAIMS_SESSION_KEY,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS,
  sessionKey: DEFAULT.SESSION_KEY
}

// const include_error_description = true

export const defValidateClaim = (assertion: Assertion, options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    claimsSessionKey: claims_session_key,
    logPrefix: prefix,
    reportAllAjvErrors: allErrors,
    sessionKey: session_key
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = new Ajv({ allErrors })
  }

  throwIfDoesNotConform({ prefix }, ajv, options_schema, config)

  const validateClaim: onRequestHookHandler = (request, _reply, done) => {
    const session = (request as any)[session_key] as Session<SessionData>

    request.log.debug(
      `${prefix}get access token claims from session '${session_key}', key '${claims_session_key}'`
    )
    const claims: JWTPayload | undefined = session.get(claims_session_key)

    if (!claims) {
      const error_description = `No access token claims in session`
      throw new UnauthorizedError({ error_description })
    }

    const key = assertion.claim

    if (!assertion.op && !assertion.value) {
      if (!claims[key]) {
        const error_description = `No claim '${key}' in session`
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
        `${prefix}the value provided for validating claim '${key}' is a function. Invoking it now.`
      )
      given = assertion.value()
    } else {
      given = assertion.value
    }
    request.log.debug(
      `${prefix}validate assertion on claim '${key}': ${actual} ${op} ${given}`
    )

    if (given === undefined) {
      const error_description = `Invalid assertion on claim '${key}'. The value given for the assertion is (or resolved to) undefined.`
      throw new InvalidRequestError({ error_description })
    }

    // I think HTTP 403 Forbidden is the right status code to use here.
    // https://micropub.spec.indieweb.org/#error-response

    switch (op) {
      case '==': {
        if (actual !== given) {
          const error_description = `claim '${key}' is '${actual}', but it should be '${given}'`
          const err = new ForbiddenError({ error_description })
          throw err
          // return reply
          //   .code(err.statusCode)
          //   .send(err.payload({ include_error_description }))
        } else {
          return done()
        }
      }

      case '!=': {
        if (actual === given) {
          const error_description = `claim '${key}' is '${actual}', but it should not be '${given}'`
          throw new ForbiddenError({ error_description })
        } else {
          return done()
        }
      }

      case '<': {
        if (actual >= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than '${given}'`
          throw new ForbiddenError({ error_description })
        } else {
          return done()
        }
      }

      case '<=': {
        if (actual > given) {
          const error_description = `claim '${key}' is '${actual}', but it should be less than or equal to '${given}'`
          throw new ForbiddenError({ error_description })
        } else {
          return done()
        }
      }

      case '>': {
        if (actual <= given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than '${given}'`
          throw new ForbiddenError({ error_description })
        } else {
          return done()
        }
      }

      case '>=': {
        if (actual < given) {
          const error_description = `claim '${key}' is '${actual}', but it should be greater than or equal to '${given}'`
          throw new ForbiddenError({ error_description })
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
