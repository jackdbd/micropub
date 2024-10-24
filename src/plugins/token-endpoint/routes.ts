import type { RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'
// import { type Session } from '@fastify/secure-session'
import * as token from '../../lib/token.js'
// import type { SecureSessionData } from '../interfaces.js'

export interface TokenPostConfig {
  algorithm: string
  expiration: string
  issuer: string
  me: string
  prefix: string
}

export const defTokenPost = (config: TokenPostConfig) => {
  const { algorithm, expiration, issuer, me, prefix } = config
  const tokenPost: RouteHandler = async (request, reply) => {
    // const session = request.session as Session<SecureSessionData>

    // const code_verifier = session.get('code_verifier')

    // const body = request.body

    // https://github.com/jackdbd/indiekit/blob/840a9669bf5834d7a63365611b5e515c536684e5/packages/endpoint-auth/lib/controllers/token.js
    // https://github.com/jackdbd/indiekit/blob/840a9669bf5834d7a63365611b5e515c536684e5/packages/indiekit/lib/indieauth.js#L52
    // const alg = 'HS256'

    const { error: token_error, value: secret } = await token.secret({
      alg: algorithm
    })
    if (token_error) {
      return reply.send({
        error: `Could not generate secret: ${token_error.message}`
      })
    }

    // TODO: how do I get these?
    const scope = 'create update'

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
        error: `Could not verify token: ${verify_error.message}`
      })
    }

    reply.header('Authorization', jwt)
    request.log.debug(`${prefix} set Bearer <JWT> in Authorization header`)

    // https://indieauth.spec.indieweb.org/#access-token-response-p-5

    const { exp } = verified.payload
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - Math.floor(new Date().getTime() / 1000)
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
  me: string
  prefix: string
}

export const defTokenGet = (config: TokenGetConfig) => {
  const { me, prefix } = config

  const tokenGet: RouteHandler = async (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      return reply.view('error.njk', {
        message: `jwt not found in session`,
        description: 'Token error page',
        title: 'Token error'
      })
    }

    request.log.debug(
      `${prefix} extracted jwt (access token) from secure session`
    )

    const payload = token.decode({ jwt })
    request.log.debug(`${prefix} decoded payload from jwt (access token)`)

    return reply.view('token.njk', {
      description: 'Token page',
      title: 'Token',
      me,
      payload: stringify(payload, undefined, 2)
    })
  }

  return tokenGet
}
