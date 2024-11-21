import type { FastifyRequest, RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'
import { unixTimestamp } from '../../lib/date.js'
import * as token from '../../lib/token.js'
import { invalid_request } from './errors.js'

export interface TokenPostConfig {
  algorithm: string
  authorization_endpoint: string
  base_url: string
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

const shouldRespondWithHtml = (request: FastifyRequest) => {
  if (request.headers.accept && request.headers.accept.includes('text/html')) {
    return true
  } else {
    return false
  }
}

export const defTokenPost = (config: TokenPostConfig) => {
  const {
    algorithm,
    authorization_endpoint,
    base_url,
    expiration,
    issuer,
    prefix
  } = config

  const tokenPost: RouteHandler = async (request, reply) => {
    const { client_id, code, redirect_uri } =
      request.body as ResponseBodyFromAuth

    const { error: token_error, value: secret } = await token.secret({
      alg: algorithm
    })

    if (token_error) {
      return reply.send({
        ok: false,
        error: `Could not generate secret: ${token_error.message}`
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
      const message = `could not verify authorization code`
      if (shouldRespondWithHtml(request)) {
        return reply.code(invalid_request.code).view('error.njk', {
          base_url,
          message,
          description: 'Auth error page',
          title: 'Auth error'
        })
      } else {
        return reply
          .code(invalid_request.code)
          .send(invalid_request.payload(message))
      }
    }

    const auth_response = await authResponse.json()

    const { me, scope } = auth_response
    request.session.set('scope', scope)
    request.log.debug(
      `${prefix} verified authorization code and stored scope in secure session`
    )

    if (!scope) {
      return reply.send({
        ok: false,
        error: `scope not found in authorization`
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
      return reply.send({
        ok: false,
        error: `Could not sign token: ${sign_error.message}`
      })
    }

    const { error: verify_error, value: verified } = await token.verify({
      expiration,
      issuer,
      jwt,
      secret
    })

    if (verify_error) {
      return reply.send({
        ok: false,
        error: `Could not verify token: ${verify_error.message}`
      })
    }

    // console.log('=== ACCESS TOKEN ===')
    // console.log(jwt)
    // console.log('=== === ===')

    reply.header('Authorization', jwt)
    request.log.debug(`${prefix} set Bearer <JWT> in Authorization header`)

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
      return reply.view('error.njk', {
        base_url,
        description: 'Token error page',
        message: `jwt not found in session`,
        title: 'Token error'
      })
    }

    request.log.debug(
      `${prefix} extracted jwt (access token) from secure session`
    )

    const payload = token.decode({ jwt })
    request.log.debug(`${prefix} decoded payload from jwt (access token)`)

    return reply.view('token.njk', {
      base_url,
      description: 'Token page',
      payload: stringify(payload, undefined, 2),
      title: 'Token'
    })
  }

  return tokenGet
}
