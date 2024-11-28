import type { RouteHandler } from 'fastify'
import {
  invalidRequest,
  unauthorized
} from '../../../lib/micropub/error-responses.js'

// https://indieauth.spec.indieweb.org/#authorization-response
interface AuthQuery {
  code: string
  iss: string
  me: string
  state: string
}

export interface Config {
  client_id: string
  include_error_description: boolean
  prefix: string
  redirect_uri: string
  token_endpoint: string
}

export const defAuthCallback = (config: Config) => {
  const {
    client_id,
    include_error_description,
    prefix,
    redirect_uri,
    token_endpoint
  } = config

  const callback: RouteHandler<{ Querystring: AuthQuery }> = async (
    request,
    reply
  ) => {
    // TODO: I think I need to implement indieauth-metadata to receive `iss` in
    // the query string from the authorization endpoint.
    // https://indieauth.spec.indieweb.org/#authorization-response
    const { code } = request.query
    // const { code, me } = request.query

    const state = request.session.get('state')

    if (!state) {
      const error_description = `Key 'state' was not found in session or it is undefined.`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Authentication error',
        description: 'Authentication error page'
      })
    }

    request.log.debug(`${prefix}extracted state (CSRF token) from session`)

    if (state !== request.query.state) {
      const error_description = `Parameter 'state' found in query string does not match key 'state' found in session.`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Authentication error',
        description: 'Authentication error page'
      })
    }

    request.log.debug(
      `${prefix}state (CSRF token) from query string matches state from session`
    )

    const code_verifier = request.session.get('code_verifier')

    if (!code_verifier) {
      const error_description = `Key 'code_verifier' was not found in session or it is undefined.`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Authentication error',
        description: 'Authentication error page'
      })
    }

    request.log.debug(`${prefix}extracted code_verifier from session`)

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
      const error_description = `Failed to exchange authorization code for access token.`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token error',
        description: 'Token error page'
      })
    }

    // let payload: string
    try {
      const tokenResponse = await response.json()
      console.log('=== defAuthCallback tokenResponse ===', tokenResponse)
      // payload = stringify(tokenResponse, undefined, 2)
      // payload = stringify(tokenResponse.payload, undefined, 2)
    } catch (err) {
      const error = err as Error
      const error_description = `Failed to parse response received from token endpoint: ${error.message}`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token error',
        description: 'Token error page'
      })
    }

    const auth = response.headers.get('Authorization')

    if (!auth) {
      const error_description = `Request has no Authorization header`

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Auth error',
        description: 'Auth error page'
      })
    }

    request.session.set('jwt', auth)
    request.log.debug(
      `${prefix}set access token in session key 'jwt'. Redirecting to token endpoint ${token_endpoint}`
    )

    return reply.redirect(token_endpoint)
  }

  return callback
}
