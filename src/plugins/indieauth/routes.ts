import type { RouteHandler } from 'fastify'
import { codeChallenge } from './code-challenge.js'
import { codeVerifier } from './code-verifier.js'

export interface LoginConfig {
  authorization_endpoint: string
  client_id: string
  code_challenge_method: string
  len: number
  me: string
  prefix: string
  redirect_uri: string
}

export const defLogin = (config: LoginConfig) => {
  const {
    authorization_endpoint,
    client_id,
    code_challenge_method,
    len,
    me,
    prefix,
    redirect_uri
  } = config

  const login: RouteHandler = (request, reply) => {
    const state = reply.generateCsrf()
    request.session.set('state', state)
    request.log.debug(
      `${prefix}generated state (CSRF token) and set it in session`
    )

    const code_verifier = codeVerifier({ len })
    request.log.debug(`${prefix}generated code_verifier of ${len} characters`)
    request.session.set('code_verifier', code_verifier)
    request.log.debug(`${prefix}generated code_verifier and set it in session`)

    const code_challenge = codeChallenge({
      code_challenge_method,
      code_verifier
    })

    request.session.set('code_challenge', code_challenge)
    request.log.debug(
      `${prefix}generated ${code_challenge_method} code_challenge (PKCE) and set it in session`
    )

    return reply.view('login.njk', {
      authorization_endpoint,
      client_id,
      code_challenge,
      code_challenge_method,
      description: 'Login page',
      me,
      redirect_uri,
      state,
      title: 'Login'
    })
  }

  return login
}

export const logout: RouteHandler = (request, reply) => {
  request.session.delete() // no need to log this, fastify-session already logs it
  return reply.redirect('/')
}
