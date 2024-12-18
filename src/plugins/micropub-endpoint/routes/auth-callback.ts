import type { RouteHandler } from 'fastify'
import {
  invalidRequest,
  serverError,
  unauthorized
} from '../../../lib/micropub/error-responses.js'
import type { AuthCallbackQuerystring } from '../../authorization-endpoint/routes/schemas.js'

export interface Config {
  client_id: string
  include_error_description: boolean
  log_prefix: string
  redirect_uri: string
  // session_key: string // default 'access_token'
  // also, 'state' and 'code_verifier' could be configuration parameters
  token_endpoint: string
}

/**
 * Authorization callback.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 */
export const defAuthCallback = (config: Config) => {
  const {
    client_id,
    include_error_description,
    log_prefix,
    redirect_uri,
    token_endpoint
  } = config

  const callback: RouteHandler<{
    Querystring: AuthCallbackQuerystring
  }> = async (request, reply) => {
    // TODO: I think I need to implement indieauth-metadata to receive `iss` in
    // the query string from the authorization endpoint.
    // https://indieauth.spec.indieweb.org/#authorization-response
    const { iss } = request.query

    request.log.warn(
      request.query,
      `${log_prefix}query string. It should have: code, state, iss (optional)`
    )

    // TODO: Upon the redirect back to the client, the client MUST verify the things
    // mentioned here:
    // https://indieauth.spec.indieweb.org/#authorization-response
    request.log.warn(`${log_prefix}verify iss ${iss}`)

    if (!request.query.code) {
      const error_description = `Key 'code' was not found in query string or it is undefined.`
      request.log.error(`${log_prefix}${error_description}`)

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

    const state_from_session = request.session.get('state')

    if (!state_from_session) {
      const error_description = `Key 'state' was not found in session or it is undefined.`
      request.log.error(`${log_prefix}${error_description}`)

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

    if (state_from_session !== request.query.state) {
      const error_description = `Parameter 'state' found in query string does not match key 'state' found in session.`
      request.log.error(`${log_prefix}${error_description}`)

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
      `${log_prefix}state (CSRF token) found in query string matches state found in session`
    )

    const code_verifier = request.session.get('code_verifier')

    if (!code_verifier) {
      const error_description = `Key 'code_verifier' was not found in session or it is undefined.`
      request.log.error(`${log_prefix}${error_description}`)

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
        code: request.query.code,
        code_verifier,
        grant_type: 'authorization_code',
        redirect_uri
      })
    })

    if (!response.ok) {
      const error_description = `Failed to exchange authorization code for access token.`
      request.log.error(`${log_prefix}${error_description}`)

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
      request.log.error(`${log_prefix}${error_description}`)

      // I don't think it's the client's fault if we cann't parse the response
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
    request.log.debug(
      `${log_prefix}set access token in session key 'access_token'`
    )

    if (refresh_token) {
      request.session.set('refresh_token', refresh_token)
      request.log.debug(
        `${log_prefix}set refresh token in session key 'refresh_token'`
      )
    }

    request.log.debug(
      `${log_prefix}redirect to token endpoint ${token_endpoint}`
    )
    return reply.redirect(token_endpoint)
  }

  return callback
}
