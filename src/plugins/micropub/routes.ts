import type { RouteHandler } from 'fastify'
import { type Session } from '@fastify/secure-session'
import * as token from '../../lib/token.js'

export interface AuthQuery {
  code: string
  me: string
  state: string
}

export interface SecureSessionData {
  jwt: string
  state: string
}

// auth callback (I wanted to use /auth/callback but it's a bit problematic for static assets)
export const authCallback: RouteHandler<{ Querystring: AuthQuery }> = async (
  request,
  reply
) => {
  const { code, me } = request.query
  const state = request.session.get('state')

  if (!state) {
    return reply.view('error.njk', {
      message: `state not found in session`,
      description: 'Auth error page',
      title: 'Auth error'
    })
  }

  if (state !== request.query.state) {
    return reply.view('error.njk', {
      message: `state from query string does not match state from session`,
      description: 'Auth error page',
      title: 'Auth error'
    })
  }

  return reply.view('auth-success.njk', {
    code,
    code_verifier: 'foobar',
    description: 'Auth success page',
    me,
    redirect_uri: process.env.BASE_URL + '/callback',
    title: 'Auth success',
    token_endpoint: process.env.BASE_URL + '/token'
  })
}

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
        body: JSON.stringify(request.body),
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      request.log.debug(`${prefix} redirect to /post-created`)
      return reply.redirect(`/post-created?data=${JSON.stringify(data)}`)
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
  prefix: string
  redirect_uri: string
}

export const defLogin = ({
  prefix,
  authorization_endpoint,
  client_id,
  redirect_uri
}: LoginConfig) => {
  const login: RouteHandler = (request, reply) => {
    const session = request.session as Session<SecureSessionData>
    const state = 'todo-generate-state'
    session.set('state', state)
    request.log.debug(`${prefix} set state in secure session`)

    return reply.view('login.njk', {
      authorization_endpoint,
      client_id,
      redirect_uri,
      state,
      description: 'Login page',
      title: 'Login'
    })
  }

  return login
}

export const logout: RouteHandler = (request, reply) => {
  request.session.delete() // no need to log this, fastify-session already logs it
  return reply.redirect('/')
}

export interface TokenPostConfig {
  issuer: string
  me: string
  prefix: string
}

export const defTokenPost = ({ issuer, me, prefix }: TokenPostConfig) => {
  const tokenPost: RouteHandler = async (request, reply) => {
    const session = request.session as Session<SecureSessionData>

    // const body = request.body

    // https://github.com/jackdbd/indiekit/blob/840a9669bf5834d7a63365611b5e515c536684e5/packages/endpoint-auth/lib/controllers/token.js
    // https://github.com/jackdbd/indiekit/blob/840a9669bf5834d7a63365611b5e515c536684e5/packages/indiekit/lib/indieauth.js#L52
    // const tokenUrl = new URL(body.token_endpoint);
    // const tokenUrl = new URL('')
    // tokenUrl.searchParams.set('client_id', client_id)
    const alg = 'HS256'
    const expiration = '2 hours'

    const { error: token_error, value: secret } = await token.secret({ alg })
    if (token_error) {
      return reply.send({
        error: `Could not generate secret: ${token_error.message}`
      })
    }

    const payload = {
      me,
      scope: 'create update delete' // one string or multiple strings?
    }

    const { error: sign_error, value: jwt } = await token.sign({
      alg,
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

    session.set('jwt', jwt)
    request.log.debug({ verified }, `${prefix} set jwt in secure session`)

    reply.header('Authorization', jwt)
    request.log.debug(`${prefix} set Bearer <JWT> in Authorization header`)

    return reply.redirect('/editor')
  }

  return tokenPost
}
