import stringify from 'fast-safe-stringify'
import type { RouteHandler } from 'fastify'
import { codeChallenge, codeVerifier } from './utils.js'

export interface CallbackConfig {
  client_id: string
  prefix: string
  redirect_uri: string
  token_endpoint: string
}

// https://indieauth.spec.indieweb.org/#authorization-response
interface AuthQuery {
  code: string
  iss: string
  me: string
  state: string
}

export const defAuthCallback = (config: CallbackConfig) => {
  const { client_id, prefix, redirect_uri, token_endpoint } = config

  const callback: RouteHandler<{ Querystring: AuthQuery }> = async (
    request,
    reply
  ) => {
    // TODO: I think I need to implement indieauth-metadata to receive `iss` in
    // the query string from the authorization endpoint.
    // https://indieauth.spec.indieweb.org/#authorization-response
    const { code, me } = request.query

    const state = request.session.get('state')

    if (!state) {
      return reply.view('error.njk', {
        message: `state not found in session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix} extracted state (CSRF token) from secure session`
    )

    if (state !== request.query.state) {
      return reply.view('error.njk', {
        message: `state from query string does not match state from session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(
      `${prefix} state (CSRF token) from query string matches state from session`
    )

    const code_verifier = request.session.get('code_verifier')

    if (!code_verifier) {
      return reply.view('error.njk', {
        message: `code_verifier not found in session`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.log.debug(`${prefix} extracted code_verifier from secure session`)

    ////////////////////////////////////////////////////////////////////////////
    // This is for testing/demoing the token exchange.
    // return reply.view('auth-success.njk', {
    //   code,
    //   code_verifier,
    //   description: 'Auth success page',
    //   me,
    //   redirect_uri,
    //   title: 'Auth success',
    //   token_endpoint
    // })
    ////////////////////////////////////////////////////////////////////////////

    // After the IndieAuth client validates the state parameter, the client
    // makes a POST request to the token endpoint to exchange the authorization
    // code for an access token.

    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code,
        code_verifier,
        grant_type: 'authorization_code',
        redirect_uri
      })
    })

    if (!response.ok) {
      request.log.error(
        `${prefix} failed to exchange authorization code for access token`
      )
      return reply.view('error.njk', {
        message: `Failed to exchange authorization code for access token`,
        description: 'Token error page',
        title: 'Token error'
      })
    }

    let payload: string
    try {
      const tokenResponse = await response.json()
      // payload = stringify(tokenResponse, undefined, 2)
      payload = stringify(tokenResponse.payload, undefined, 2)
    } catch (err) {
      const error = err as Error
      return reply.view('error.njk', {
        description: 'Error page',
        title: error.name,
        message: error.message
      })
    }

    const auth = response.headers.get('Authorization')

    if (!auth) {
      reply.code(401)
      return reply.view('error.njk', {
        message: `missing Authorization header`,
        description: 'Auth error page',
        title: 'Auth error'
      })
    }

    request.session.set('jwt', auth)
    request.log.debug(`${prefix} set jwt in secure session`)
    // TODO: redirect to /editor?

    return reply.view('token.njk', {
      description: 'Token page',
      title: 'Token',
      me,
      payload
    })
  }

  return callback
}

export interface SubmitConfig {
  micropub_endpoint: string
  prefix: string
}

export const defSubmit = (config: SubmitConfig) => {
  const { micropub_endpoint, prefix } = config

  const submit: RouteHandler = async (request, reply) => {
    const jwt = request.session.get('jwt')

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

export interface EditorConfig {
  submit_endpoint: string
}

export const defEditor = (config: EditorConfig) => {
  const { submit_endpoint } = config

  const editor: RouteHandler = (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      request.log.debug(`redirect to /login since jwt is not in secure session`)
      return reply.redirect('/login')
    }

    return reply.view('editor.njk', {
      description: 'Editor page',
      submit_endpoint,
      title: 'Editor'
    })
  }

  return editor
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
    const state = reply.generateCsrf()
    request.session.set('state', state)
    request.log.debug(
      `${prefix} generated state (CSRF token) and set it in secure session`
    )

    const code_verifier = codeVerifier({ len })
    request.log.debug(`${prefix} generated code_verifier of ${len} characters`)
    request.session.set('code_verifier', code_verifier)
    request.log.debug(
      `${prefix} generated code_verifier and set it in secure session`
    )

    const code_challenge = codeChallenge({
      code_challenge_method,
      code_verifier
    })

    request.session.set('code_challenge', code_challenge)
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
