import Ajv from 'ajv'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type { JWTPayload } from 'jose'
import {
  InvalidRequestError,
  InvalidTokenError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import { isExpired } from '../../../lib/predicates.js'
import type { IsAccessTokenBlacklisted } from '../../../lib/schemas/index.js'
import { safeDecode, verify } from '../../../lib/token/index.js'
import { conformResult } from '../../../lib/validators.js'
import { introspection_response_body_success } from './schemas.js'

export interface Config {
  ajv: Ajv
  include_error_description: boolean
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  issuer: string
  jwks_url: any // URL
  log_prefix: string
  max_token_age?: string
}

interface RequestBody {
  token: string
  token_type_hint?: 'access_token' | 'refresh_token'
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

/**
 * Introspects a token.
 *
 * @see [OAuth 2.0 Token Introspection (RFC 7662)](https://www.rfc-editor.org/rfc/rfc7662)
 */
export const defIntrospectPost = (config: Config) => {
  const {
    ajv,
    include_error_description,
    isAccessTokenBlacklisted,
    issuer,
    jwks_url,
    log_prefix,
    max_token_age
  } = config

  const introspectPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      const error_description = 'Request has no body.'
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { token: jwt, token_type_hint } = request.body

    // TODO: allow to introspect refresh tokens?
    if (token_type_hint === 'refresh_token') {
      const error_description = `Introspecting refresh tokens is not supported by this introspection endpoint.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    if (!jwt) {
      const error_description = 'The `token` parameter is missing.'
      const err = new InvalidTokenError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // const header = jose.decodeProtectedHeader(jwt)
    // request.log.debug(header, `JWT protected header`)

    // SECURITY CONSIDERATIONS
    // https://www.rfc-editor.org/rfc/rfc7662#section-4

    // RFC 7662 says that if the token has been signed, the authorization server
    // MUST validate the signature. This means that just decoding the token is
    // not enough. We need to verify it.
    const { value: verified_claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age
    })

    const { error: decode_error, value: decoded_claims } = await safeDecode(jwt)

    let claims: JWTPayload
    if (verified_claims) {
      claims = verified_claims
    } else {
      if (decoded_claims) {
        claims = decoded_claims
      } else {
        // Having a verify_error is fine. E.g. if the token in the request body
        // is expired, we get a verify_error but NOT a decode_error.
        const error_description = decode_error.message
        const err = new InvalidTokenError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }
    }

    const { exp, jti } = claims

    // RFC 7662 says that if the token can expire, the authorization server MUST
    // determine whether or not the token has expired.
    let expired = false
    if (exp) {
      expired = isExpired(exp)
    }

    // RFC 7662 says that if the token can be revoked after it was issued, the
    // authorization server MUST determine whether or not such a revocation has
    // taken place.
    let blacklisted = false
    if (jti) {
      request.log.debug(
        `${log_prefix}check whether token ID ${jti} is blacklisted`
      )
      const { error: black_err, value } = await isAccessTokenBlacklisted(jti)

      if (black_err) {
        const error_description = `Cannot determine whether token ID ${jti} is blacklisted or not: ${black_err.message}`
        const err = new ServerError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      blacklisted = value
    }

    const active = !expired && !blacklisted ? true : false

    const response_body = { ...claims, active }

    const { error: conform_error } = conformResult(
      { prefix: log_prefix },
      ajv,
      introspection_response_body_success,
      response_body
    )

    if (conform_error) {
      const preface = `The response the server was about to send to the client does not conform to the expected schema. This is probably a bug. Here are the details of the error:`
      const error_description = `${preface} ${conform_error.message}`
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    return reply.code(200).send(response_body)
  }

  return introspectPost
}
