import stringify from 'fast-safe-stringify'
import type { RouteHandler } from 'fastify'
import { type Session } from '@fastify/secure-session'
import { codeChallenge, codeVerifier } from './utils.js'
import type { SecureSessionData } from '../interfaces.js'

export interface SubmitConfig {
  micropub_endpoint: string
  prefix: string
}

export const defSubmit = (config: SubmitConfig) => {
  const { micropub_endpoint, prefix } = config

  const submit: RouteHandler = async (request, reply) => {
    const session = request.session as Session<SecureSessionData>
    const jwt = session.get('jwt')

    if (!jwt) {
      request.log.debug(
        `${prefix} redirect to /login since jwt is not in secure session`
      )
      return reply.redirect('/login')
    }

    try {
      const response = await fetch(micropub_endpoint, {
        method: 'POST',
        body: stringify(request.body),
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      request.log.debug(`${prefix} redirect to /post-created`)
      return reply.redirect(`/post-created?data=${stringify(data)}`)
    } catch (err) {
      request.log.debug(`${prefix} redirect to /error`)
      const error = err as Error
      request.log.error(error)
      //   return reply.status(500).send({ error: 'Failed to fetch data' })
      return reply.redirect(`/error?message=${error.message}`)
    }
  }

  return submit
}

export const postCreated: RouteHandler = (request, reply) => {
  return reply.view('post-created.njk', {
    description: 'Post created page',
    title: 'Post created',
    data: (request.query as any).data
  })
}

export const editor: RouteHandler = (request, reply) => {
  const session = request.session as Session<SecureSessionData>

  const jwt = session.get('jwt')
  if (!jwt) {
    request.log.debug(`redirect to /login since jwt is not in secure session`)
    return reply.redirect('/login')
  }

  return reply.view('editor.njk', {
    description: 'Editor page',
    micropub_endpoint: process.env.BASE_URL! + '/submit',
    title: 'Editor'
  })
}

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
    const session = request.session as Session<SecureSessionData>

    const state = reply.generateCsrf()
    session.set('state', state)
    request.log.debug(
      `${prefix} generated state (CSRF token) and set it in secure session`
    )

    const code_verifier = codeVerifier({ len })
    request.log.debug(`${prefix} generated code_verifier of ${len} characters`)
    session.set('code_verifier', code_verifier)
    request.log.debug(
      `${prefix} generated code_verifier and set it in secure session`
    )

    const code_challenge = codeChallenge({
      code_challenge_method,
      code_verifier
    })

    session.set('code_challenge', code_challenge)
    request.log.debug(
      `${prefix} generated ${code_challenge_method} code_challenge (PKCE) and set it in secure session`
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
