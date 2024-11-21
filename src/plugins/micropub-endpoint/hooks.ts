import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { msToUTCString } from '../../lib/date.js'
import { decode, isBlacklisted, isExpired } from '../../lib/token.js'
import { NAME } from './constants.js'
import { invalid_token } from '../errors.js'
import { micropub_get_request } from './schemas.js'

// TODO: decode the token only once. Maybe move most code to a library.
const PREFIX = `${NAME}/hooks`

const authorizationHeaderToToken = (auth?: string) => {
  if (!auth) {
    return { error: new Error('Missing Authorization') }
  }

  if (auth.indexOf('Bearer') === -1) {
    return { error: new Error('Missing Bearer') }
  }

  const splits = auth.split(' ')
  if (splits.length !== 2) {
    return { error: new Error('Missing value for Bearer') }
  }

  return { value: splits[1] }
}

export const validateAuthorizationHeader: onRequestHookHandler = (
  request,
  reply,
  done
) => {
  const auth = request.headers.authorization

  if (!auth) {
    const message = 'missing Authorization header'
    request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
    return reply.micropubUnauthorized(message)
  }

  if (auth.indexOf('Bearer') === -1) {
    const message = 'missing Bearer in Authorization header'
    request.log.warn(`${PREFIX} ${message}`)
    return reply.micropubUnauthorized(message)
  }

  done()
}

export interface ValidateAccessTokenConfig {
  me: string
}

// TODO: make this function much more granular. It should be able to check
// individual scopes, so that a token that is not expired, not blacklisted, that
// has a matching `me` claim, BUT that has insufficient scopes for the action
// requested by the user should return HTTP 403.

export const defValidateMeClaimInAccessToken = (
  config: ValidateAccessTokenConfig
) => {
  const { me } = config

  const validateMeClaimInAccessToken: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    const auth = request.headers.authorization

    if (!auth) {
      const message = 'missing Authorization header'
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.micropubUnauthorized(message)
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      const message = `no value for 'Bearer' in Authorization header`
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.debug(`${PREFIX} access token scopes: ${scopes.join(' ')}`)

    if (claims.me !== me) {
      const message = `access token has a 'me' claim which is not ${me}`
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims. Point to the relevant
    // documentation of various token endpoints (e.g. this app, IndieLogin.com).
    const iat_utc = msToUTCString(claims.iat * 1000)
    const exp_utc = msToUTCString(claims.exp * 1000)

    const messages = [
      `access token issued by ${claims.iss} at UNIX timestamp ${claims.iat} (${iat_utc})`
    ]

    const expired = isExpired({ exp: claims.exp })
    if (expired) {
      messages.push(`expired at UNIX timestamp ${claims.exp} (${exp_utc})`)
    } else {
      messages.push(`will expire at UNIX timestamp ${claims.exp} (${exp_utc})`)
    }

    request.log.info(`${PREFIX} ${messages.join('; ')} `)

    done()
  }

  return validateMeClaimInAccessToken
}

export interface ValidateGetConfig {
  ajv: Ajv
}

export const defValidateGetRequest = (config: ValidateGetConfig) => {
  const { ajv } = config
  const validate = ajv.compile(micropub_get_request)

  const validateGetRequest: onRequestHookHandler = (request, reply, done) => {
    request.log.debug(`${PREFIX} validating incoming GET request`)

    const valid = validate(request)

    if (!valid) {
      const errors = validate.errors || []
      const message = errors
        .map((error) => error.message || 'no error message')
        .join('; ')
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.micropubInvalidRequest(message)
    }

    done()
  }

  return validateGetRequest
}

export const validateAccessTokenNotExpired: onRequestHookHandler = (
  request,
  reply,
  done
) => {
  const { error, value: jwt } = authorizationHeaderToToken(
    request.headers.authorization
  )

  if (error) {
    const message = error.message
    request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
    return reply.code(invalid_token.code).send(invalid_token.payload(message))
  }

  const payload = decode({ jwt })

  const expired = isExpired({ exp: payload.exp })

  if (expired) {
    const message = `access token has expired`
    request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
    return reply.code(invalid_token.code).send(invalid_token.payload(message))
  }

  done()
}

export const validateAccessTokenNotBlacklisted: onRequestHookHandler = async (
  request,
  reply
) => {
  const { error, value: jwt } = authorizationHeaderToToken(
    request.headers.authorization
  )

  if (error) {
    const message = error.message
    request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
    return reply.code(invalid_token.code).send(invalid_token.payload(message))
  }

  const blacklisted = await isBlacklisted({ jwt })
  if (blacklisted) {
    const message = 'access token is blacklisted'
    request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
    return reply.code(invalid_token.code).send(invalid_token.payload(message))
  }
}

export interface ValidateAccessTokenScopeConfig {
  scope: string
}

// https://micropub.spec.indieweb.org/#scope
export const defValidateScopeInAccessToken = (
  config: ValidateAccessTokenScopeConfig
) => {
  const { scope } = config

  const validateScopeInAccessToken: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    request.log.debug(
      `${PREFIX} validating that access token includes scope '${scope}'`
    )
    const auth = request.headers.authorization

    if (!auth) {
      const message = 'missing Authorization header'
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.micropubInvalidRequest(message)
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      const message = `no value for 'Bearer' in Authorization header`
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.debug(`${PREFIX} access token scopes: ${scopes.join(' ')}`)

    if (!scopes.includes(scope)) {
      const message = `access token does not include scope '${scope}'`
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.micropubInsufficientScope(message)
    }

    done()
  }

  return validateScopeInAccessToken
}
