import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { decode, isBlacklisted, isExpired } from '../../lib/token.js'
import { NAME } from './constants.js'
import { micropub_get_request } from './schemas.js'

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

export interface ValidateAccessTokenConfig {
  base_url: string
  me: string
}

// TODO: make this function much more granular. It should be able to check
// individual scopes, so that a token that is not expired, not blacklisted, that
// has a matching `me` claim, BUT that has insufficient scopes for the action
// requested by the user should return HTTP 403.

export const defValidateAccessToken = (config: ValidateAccessTokenConfig) => {
  const { base_url, me } = config

  const validateAccessToken: onRequestHookHandler = (request, reply, done) => {
    request.log.debug(
      `${NAME} validating access token from Authorization header`
    )

    // TODO: why is this the case? I can't remember if the micropub specs says
    // anything against non-POST requests.
    // if (request.method.toUpperCase() !== 'POST') {
    //   request.log.warn(
    //     `${NAME} request ID ${request.id} is a ${request.method} request, not a POST`
    //   )
    //   reply.code(415)
    //   return reply.send({
    //     ok: false,
    //     message: `${request.method} requests not allowed to this endpoint`
    //   })
    // }

    const auth = request.headers.authorization

    if (!auth) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no 'Authorization' header`
      )
      reply.code(401)
      // return reply.send({ ok: false, message: `missing Authorization header` })
      return reply.view('error.njk', {
        base_url,
        description: 'Auth error page',
        message: `missing Authorization header`,
        title: 'Auth error'
      })
    }

    if (auth.indexOf('Bearer') === -1) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const splits = auth.split(' ')
    if (splits.length !== 2) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no value for 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.info(`${NAME} access token scopes: ${scopes.join(' ')}`)

    if (claims.me !== me) {
      // https://indieauth.spec.indieweb.org/#error-responses
      return reply.code(401).send({
        error: 'invalid_token',
        error_description: `access token has a 'me' claim which is not ${me}`
      })
    }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims.
    // const date = new Date(claims.issued_at * 1000)
    const iat_utc = new Date(claims.iat * 1000).toUTCString()
    const exp_utc = new Date(claims.exp * 1000).toUTCString()

    request.log.info(
      `${NAME} access token issued by ${claims.iss} at ${claims.iat} (${iat_utc}), will expire at ${claims.exp} (${exp_utc})`
    )

    done()
  }

  return validateAccessToken
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
  // https://indieauth.spec.indieweb.org/#error-responses
  if (error) {
    return reply.code(401).send({
      error: 'invalid_token',
      error_description: error.message
    })
  }

  const payload = decode({ jwt })

  const expired = isExpired({ exp: payload.exp })
  if (expired) {
    return reply.code(401).send({
      error: 'invalid_token',
      error_description: 'The access token has expired.'
    })
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
  // https://indieauth.spec.indieweb.org/#error-responses
  if (error) {
    return reply.code(401).send({
      error: 'invalid_token',
      error_description: error.message
    })
  }

  const blacklisted = await isBlacklisted({ jwt })
  if (blacklisted) {
    return reply.code(401).send({
      error: 'invalid_token',
      error_description: 'The access token has been blacklisted.'
    })
  }
}
