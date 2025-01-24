import type { Session, SessionData } from '@fastify/secure-session'
import { applyToDefaults } from '@hapi/hoek'
import type { AccessTokenClaims } from '@jackdbd/oauth2-tokens'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { msToUTCString } from '../../date.js'
import { isExpired } from '../../predicates.js'
import { DEFAULT } from './constants.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  claimsSessionKey: DEFAULT.CLAIMS_SESSION_KEY,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS,
  sessionKey: DEFAULT.SESSION_KEY
}

export const defLogIatAndExpClaims = (options?: Options) => {
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

  throwWhenNotConform(
    { ajv, schema: options_schema, data: config },
    { basePath: 'log-iat-and-exp-claims-options' }
  )

  const logIatAndExpClaims: onRequestHookHandler = (request, _reply, done) => {
    const session = (request as any)[session_key] as Session<SessionData>

    const claims: AccessTokenClaims | undefined =
      session.get(claims_session_key)

    if (!claims) {
      return done()
    }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims. Point to the relevant
    // documentation of various token endpoints (e.g. this app, IndieLogin.com).
    const iat_utc = msToUTCString(claims.iat * 1000)
    const exp_utc = msToUTCString(claims.exp * 1000)

    const messages = [
      `access token issued by ${claims.iss} at UNIX timestamp ${claims.iat} (${iat_utc})`
    ]

    const expired = isExpired(claims.exp)
    if (expired) {
      messages.push(`expired at UNIX timestamp ${claims.exp} (${exp_utc})`)
    } else {
      messages.push(`will expire at UNIX timestamp ${claims.exp} (${exp_utc})`)
    }

    request.log.debug(`${prefix}${messages.join('; ')} `)

    return done()
  }

  return logIatAndExpClaims
}
