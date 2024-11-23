import type { RouteHandler } from 'fastify'
import { unixTimestamp } from '../../lib/date.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'
import {
  INVALID_REQUEST,
  INVALID_TOKEN,
  UNAUTHORIZED
} from '../../lib/http-error.js'
import * as token from '../../lib/token.js'
import { safeDecode } from '../../lib/token.js'

export interface TokenPostConfig {
  algorithm: string
  authorization_endpoint: string
  expiration: string
  issuer: string
  prefix: string
}

interface ResponseBodyFromAuth {
  client_id: string
  code: string
  code_verifier: string
  grant_type: string
  redirect_uri: string
}

export const defTokenPost = (config: TokenPostConfig) => {
  const { algorithm, authorization_endpoint, expiration, issuer, prefix } =
    config

  const tokenPost: RouteHandler = async (request, reply) => {
    const { client_id, code, redirect_uri } =
      request.body as ResponseBodyFromAuth

    const { error: token_error, value: secret } = await token.secret({
      alg: algorithm
    })

    if (token_error) {
      const error_description = `Could not generate secret: ${token_error.message}`
      request.log.warn(`${prefix}${error_description}`)

      return reply.tokenErrorResponse(INVALID_REQUEST.code, {
        error: INVALID_REQUEST.error,
        error_description
      })
    }

    ////////////////////////////////////////////////////////////////////////////
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
      request.log.warn(`${prefix}${error_description}`)

      return reply.authorizationErrorResponse(INVALID_REQUEST.code, {
        error: INVALID_REQUEST.error,
        error_description
      })
    }

    const auth_response = await authResponse.json()

    const { me, scope } = auth_response
    request.session.set('scope', scope)
    request.log.debug(
      `${prefix}verified authorization code and stored scope in secure session`
    )

    if (!scope) {
      const error_description = `scope not found in session`
      request.log.warn(`${prefix}${error_description}`)

      return reply.authorizationErrorResponse(INVALID_REQUEST.code, {
        error: INVALID_REQUEST.error,
        error_description
      })
    }

    const payload = { me, scope }

    const { error: sign_error, value: jwt } = await token.sign({
      algorithm,
      expiration,
      issuer,
      payload,
      secret
    })

    if (sign_error) {
      const error_description = `could not sign token: ${sign_error.message}`
      request.log.warn(`${prefix}${error_description}`)

      return reply.tokenErrorResponse(INVALID_TOKEN.code, {
        error: INVALID_TOKEN.error,
        error_description
      })
    }

    const { error: verify_error, value: verified } = await token.verify({
      expiration,
      issuer,
      jwt,
      secret
    })

    if (verify_error) {
      const error_description = `could not verify token: ${verify_error.message}`
      request.log.warn(`${prefix}${error_description}`)

      return reply.tokenErrorResponse(INVALID_TOKEN.code, {
        error: INVALID_TOKEN.error,
        error_description
      })
    }

    reply.header('Authorization', jwt)
    request.log.debug(`${prefix}set Bearer <JWT> in Authorization header`)

    // https://indieauth.spec.indieweb.org/#access-token-response-p-5

    const { exp } = verified.payload
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestamp()
    }

    return reply.send({
      access_token: jwt,
      expires_in,
      me,
      payload: verified.payload,
      // profile: '',
      // refresh_token: ''
      scope,
      token_type: 'Bearer'
    })
  }

  return tokenPost
}

export interface TokenGetConfig {
  base_url: string
  prefix: string
}

export const defTokenGet = (config: TokenGetConfig) => {
  const { base_url, prefix } = config

  const tokenGet: RouteHandler = async (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      const error_description = `access token not found in session`
      request.log.warn(`${prefix}${error_description}`)

      return reply.tokenErrorResponse(UNAUTHORIZED.code, {
        error: UNAUTHORIZED.error,
        error_description
      })
    }

    request.log.debug(`${prefix}access token extracted from session`)

    const result = await safeDecode(jwt)

    if (result.error) {
      const error_description = `failed to decode token: ${result.error.message}`
      request.log.warn(`${prefix}${error_description}`)

      return reply.tokenErrorResponse(INVALID_TOKEN.code, {
        error: INVALID_TOKEN.error,
        error_description
      })
    } else {
      const claims = result.value
      request.log.debug(claims, `${prefix}claims decoded from access token`)

      if (clientAcceptsHtml(request)) {
        return reply.view('token.njk', {
          base_url,
          claims,
          description: 'IndieAuth token endpoint success page',
          jwt,
          title: 'Token'
        })
      } else {
        return reply.send({ claims, jwt })
      }
    }
  }

  return tokenGet
}
