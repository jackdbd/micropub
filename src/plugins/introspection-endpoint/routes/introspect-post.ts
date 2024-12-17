import Ajv from 'ajv'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type { JWTPayload } from 'jose'
import {
  invalidRequest,
  invalidToken,
  serverError
} from '../../../lib/micropub/index.js'
import type { IsBlacklisted } from '../../../lib/schemas/index.js'
import { isExpired, safeDecode, verify } from '../../../lib/token/index.js'
import { conformResult } from '../../../lib/validators.js'
import { introspect_post_response_body } from '../schemas.js'

export interface Config {
  ajv: Ajv
  expiration: string
  include_error_description: boolean
  isBlacklisted: IsBlacklisted
  issuer: string
  jwks_url: any // URL
  prefix: string
}

interface RequestBody {
  token: string
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

export const defIntrospectPost = (config: Config) => {
  const {
    ajv,
    expiration,
    include_error_description,
    isBlacklisted,
    issuer,
    jwks_url,
    prefix
  } = config

  const introspectPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      const error_description = 'Request has no body'
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        description: 'Introspection endpoint error page',
        title: 'Invalid request'
      })
    }

    const { token: jwt } = request.body

    if (!jwt) {
      const error_description = 'The `token` parameter is missing'
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Invalid token',
        description: 'Introspection endpoint error page'
      })
    }

    // const header = jose.decodeProtectedHeader(jwt)
    // request.log.debug(header, `JWT protected header`)

    // SECURITY CONSIDERATIONS
    // https://www.rfc-editor.org/rfc/rfc7662#section-4

    // RFC7662 says that if the token has been signed, the authorization server
    // MUST validate the signature. This means that just decoding the token is
    // not enough. We need to verify it.
    const { value: verified_claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
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
        request.log.warn(`${prefix}${error_description}`)

        const { code, body } = invalidToken({
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, {
          ...body,
          title: 'Invalid token',
          description: 'Introspection endpoint error page'
        })
      }
    }

    const { exp, jti } = claims

    // RFC7662 says that if the token can expire, the authorization server MUST
    // determine whether or not the token has expired.
    let expired = false
    if (exp) {
      expired = isExpired(exp)
    }

    // RFC7662 says that if the token can be revoked after it was issued, the
    // authorization server MUST determine whether or not such a revocation has
    // taken place.
    let blacklisted = false
    if (jti) {
      request.log.debug(`${prefix}check whether token ID ${jti} is blacklisted`)
      const { error: black_err, value } = await isBlacklisted(jti)

      if (black_err) {
        const error_description = `cannot determine whether token ID ${jti} is blacklisted or not: ${black_err.message}`
        request.log.error(`${prefix}${error_description}`)

        const { code, body } = serverError({
          error: 'is_blacklisted_error',
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, {
          ...body,
          title: 'Blacklist error',
          description: 'Introspection endpoint error page'
        })
      }

      blacklisted = value
    }

    const active = !expired && !blacklisted ? true : false

    const response_body = { ...claims, active }

    const { error: conform_error } = conformResult(
      { prefix },
      ajv,
      introspect_post_response_body,
      response_body
    )

    if (conform_error) {
      const preface = `The response the server was about to send to the client does not conform to the expected schema. This is probably a bug. Here are the details of the error:`
      const error_description = `${preface} ${conform_error.message}`

      const { code, body } = serverError({
        error: 'response_does_not_conform_to_schema',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Response does not conform to schema',
        description: 'Introspection endpoint error page'
      })
    }

    return reply.successResponse(200, {
      title: 'Token introspection',
      summary: active ? `Token is active.` : `Token is not active.`,
      payload: response_body
    })
  }

  return introspectPost
}
