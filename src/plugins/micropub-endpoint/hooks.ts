import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { msToUTCString } from '../../lib/date.js'
import { decode, isBlacklisted, isExpired } from '../../lib/token.js'
import { NAME } from './constants.js'
import {
  invalid_authorization,
  insufficient_scope,
  invalid_token
} from '../errors.js'
import { micropub_get_request } from './schemas.js'

// TODO: decode the token only once. Maybe move most code to a library.

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
    return reply
      .code(invalid_authorization.code)
      .send(invalid_authorization.payload(`missing Authorization header`))
  }

  if (auth.indexOf('Bearer') === -1) {
    return reply
      .code(invalid_authorization.code)
      .send(
        invalid_authorization.payload(`missing Bearer in Authorization header`)
      )
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
      return reply
        .code(invalid_authorization.code)
        .send(invalid_authorization.payload(`missing Authorization header`))
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no value for 'Bearer' in Authorization header`
      )
      return reply
        .code(invalid_token.code)
        .send(invalid_token.payload(`access token is required`))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.info(`${NAME} access token scopes: ${scopes.join(' ')}`)

    if (claims.me !== me) {
      return reply
        .code(invalid_token.code)
        .send(
          invalid_token.payload(
            `access token has a 'me' claim which is not ${me}`
          )
        )
    }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims.
    // const date = msToUTCString(claims.issued_at * 1000)
    // const date = msToUTCString(claims.iss * 1000)
    const iat_utc = msToUTCString(claims.iat * 1000)
    const exp_utc = msToUTCString(claims.exp * 1000)

    request.log.info(
      `${NAME} access token issued by ${claims.iss} at ${claims.iat} (${iat_utc}), will expire at ${claims.exp} (${exp_utc})`
    )

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
    request.log.debug(`${NAME} validating incoming GET request`)

    const valid = validate(request)

    if (!valid) {
      request.log.warn(`${NAME} received invalid micropub GET request`)
      const errors = validate.errors || []
      errors.forEach((error) => {
        request.log.error(`${NAME} ${error.message || 'no error message'}`)
      })
      return reply.unauthorized(`invalid micropub request`)
    }

    request.log.debug(`${NAME} done validating micropub GET request`)
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
    return reply
      .code(invalid_token.code)
      .send(invalid_token.payload(error.message))
  }

  const payload = decode({ jwt })

  const expired = isExpired({ exp: payload.exp })
  if (expired) {
    return reply
      .code(invalid_token.code)
      .send(invalid_token.payload('The access token has expired.'))
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
    return reply
      .code(invalid_token.code)
      .send(invalid_token.payload(error.message))
  }

  const blacklisted = await isBlacklisted({ jwt })
  if (blacklisted) {
    return reply
      .code(invalid_token.code)
      .send(invalid_token.payload('The access token has been blacklisted.'))
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
    request.log.info(
      `${NAME} validating that access token includes scope '${scope}'`
    )
    const auth = request.headers.authorization

    if (!auth) {
      return reply
        .code(invalid_authorization.code)
        .send(invalid_authorization.payload(`missing Authorization header`))
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no value for 'Bearer' in Authorization header`
      )
      return reply
        .code(invalid_token.code)
        .send(invalid_token.payload(`access token is required`))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.info(`${NAME} access token scopes: ${scopes.join(' ')}`)

    if (!scopes.includes(scope)) {
      return reply
        .code(insufficient_scope.code)
        .send(
          insufficient_scope.payload(
            `access token does not include scope '${scope}'`
          )
        )
    }

    done()
  }

  return validateScopeInAccessToken
}
