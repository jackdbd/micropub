import type { RouteHandler } from 'fastify'
import {
  invalidRequest,
  serverError,
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
  // session_key: string // default 'access_token'
  // also, 'state' and 'code_verifier' could be configuration parameters
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

    let access_token: string | undefined
    let refresh_token: string | undefined
    try {
      const res_body = await response.json()
      // console.log('=== token endpoint response body in auth-callback ===', res_body)
      access_token = res_body.access_token
      refresh_token = res_body.refresh_token
    } catch (err) {
      const error = err as Error
      const error_description = `Failed to parse the JSON response received from the token endpoint: ${error.message}`
      request.log.error(`${prefix}${error_description}`)

      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      const { code, body } = serverError({
        error: 'response_body_parse_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token error',
        description: 'Token error page'
      })
    }

    if (!access_token) {
      const error_description = `Response body from token endpoint has no access_token parameter.`

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

    request.session.set('access_token', access_token)
    request.log.debug(`${prefix}set access token in session key 'access_token'`)

    if (refresh_token) {
      request.session.set('refresh_token', refresh_token)
      request.log.debug(
        `${prefix}set refresh token in session key 'refresh_token'`
      )
    }

    request.log.debug(`${prefix}redirect to token endpoint ${token_endpoint}`)
    return reply.redirect(token_endpoint)
  }

  return callback
}
