import type { RouteHandler } from 'fastify'
import type { JWK } from 'jose'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import { invalidRequest, serverError } from '../../../lib/micropub/index.js'
import { randomKid, sign } from '../../../lib/token/sign-jwt.js'
import { verify } from '../../../lib/token/verify-jwt.js'

export interface Config {
  authorization_endpoint: string
  expiration: string
  include_error_description: boolean
  issuer: string
  jwks: { keys: JWK[] }
  jwks_url: URL
  log_prefix: string
}

interface ResponseBodyFromAuth {
  client_id: string
  code: string
  code_verifier: string
  grant_type: string
  redirect_uri: string
}

export const defTokenPost = (config: Config) => {
  const {
    authorization_endpoint,
    expiration,
    include_error_description,
    issuer,
    jwks,
    jwks_url,
    log_prefix
  } = config

  const tokenPost: RouteHandler = async (request, reply) => {
    const { client_id, code, redirect_uri } =
      request.body as ResponseBodyFromAuth

    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    const authResponse = await fetch(authorization_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ client_id, code, redirect_uri })
    })

    if (!authResponse.ok) {
      const error_description = `could not verify authorization code`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const auth_response = await authResponse.json()

    const { me, scope } = auth_response
    request.session.set('scope', scope)
    request.log.debug(
      `${log_prefix}verified authorization code and stored scope in session`
    )

    if (!scope) {
      const error_description = `scope not found in session`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const payload = { me, scope }

    request.log.debug(
      `${log_prefix}try selecting one JWK from the ${jwks.keys.length} keys available in the JWKS`
    )
    const { error: kid_error, value: kid } = randomKid(jwks.keys)

    if (kid_error) {
      const error_description = kid_error.message
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'jwks_kid_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}try signing JWT using key ID ${kid}`)

    const { error: sign_error, value: jwt } = await sign({
      expiration,
      issuer,
      jwks,
      kid,
      payload
    })

    if (sign_error) {
      const error_description = `cannot sign token: ${sign_error.message}`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'jwt_sign_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    if (verify_error) {
      const error_description = `cannot verify token: ${verify_error.message}`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'jwt_verify_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    reply.header('Authorization', jwt)
    request.log.debug(`${log_prefix}set Bearer <JWT> in Authorization header`)

    // https://indieauth.spec.indieweb.org/#access-token-response-p-5

    const { exp } = claims
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestampInSeconds()
    }

    return reply.send({
      access_token: jwt,
      expires_in,
      me,
      payload: claims,
      // profile: '',
      // refresh_token: ''
      scope,
      token_type: 'Bearer'
    })
  }

  return tokenPost
}
