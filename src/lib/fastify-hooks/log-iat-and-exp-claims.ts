import type { onRequestHookHandler } from 'fastify'
import { msToUTCString } from '../date.js'
import { isExpired } from '../token/index.js'

export interface Options {
  include_error_description?: boolean
  log_prefix?: string
}

export const defLogIatAndExpClaims = (options?: Options) => {
  const opt = options ?? {}
  // const include_error_description = opt.include_error_description || false
  const log_prefix = opt.log_prefix ?? ''

  const logIatAndExpClaims: onRequestHookHandler = (request, _reply, done) => {
    const claims = request.session.get('claims')

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

    request.log.debug(`${log_prefix}${messages.join('; ')} `)

    return done()
  }

  return logIatAndExpClaims
}
