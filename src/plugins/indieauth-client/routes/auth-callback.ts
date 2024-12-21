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
  token_endpoint?: string
}

/**
 * Authorization callback for the IndieAuth flow.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 */
export const defAuthCallback = (config: Config) => {
  const { client_id, include_error_description, log_prefix, redirect_uri } =
    config

  const callback: RouteHandler<{
    Querystring: AuthCallbackQuerystring
  }> = async (request, reply) => {
    const session_data = { code_verifier: '', issuer: '', state: '' }
    type SessionKey = keyof typeof session_data
    for (const key of Object.keys(session_data) as SessionKey[]) {
      const value = request.session.get(key)
      if (value) {
        session_data[key] = value
      } else {
        const error_description = `Key '${key}' not found in session or it is undefined.`
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
    }

    const query_data = { code: '', iss: '', state: '' }
    type QueryKey = keyof typeof query_data
    for (const key of Object.keys(query_data) as QueryKey[]) {
      const value = request.query[key]
      if (value) {
        query_data[key] = value
      } else {
        const error_description = `Key '${key}' not found in query string or it is undefined.`
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
    }

    // The client MUST verify 'iss' and 'state', as mentioned here:
    // https://indieauth.spec.indieweb.org/#authorization-response

    if (session_data.issuer !== query_data.iss) {
      const error_description = `Parameter 'iss' found in query string does not match key 'issuer' found in session.`
      request.log.error(
        { query_string: query_data.iss, session: session_data.issuer },
        `${log_prefix}${error_description}`
      )

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
      `${log_prefix}issuer verified: 'iss' in query string matches 'issuer' found in session`
    )

    if (session_data.state !== query_data.state) {
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
      `${log_prefix}state (CSRF token) verified: 'state' in query string matches 'state' found in session`
    )

    // After the client validates the state parameter, the client makes a POST
    // request to the token endpoint to exchange the authorization code for an
    // access token.
    // https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code
    let token_endpoint = config.token_endpoint
    if (!token_endpoint) {
      request.log.debug(
        `${log_prefix}token_endpoint not provided in config. Trying to find it in the session.`
      )
      token_endpoint = request.session.get('token_endpoint')
    }

    // TODO: implement this behavior.
    // Once the client has obtained an authorization code, it can redeem it for
    // an access token OR the user's final profile URL.
    // This means that not knowing the token endpoint here should NOT result in
    // an error. It should mean that the client can ONLY authenticate the user,
    // and not authorize him/her.
    // https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code

    if (!token_endpoint) {
      const error_description = `Token endpoint not set. It was neither provided in the configuration, nor it was found in the session.`
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

    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code: query_data.code,
        code_verifier: session_data.code_verifier,
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
    request.log.debug(`${log_prefix}set access token in session`)

    if (refresh_token) {
      request.session.set('refresh_token', refresh_token)
      request.log.debug(`${log_prefix}set refresh token in session`)
    }

    request.log.debug(
      `${log_prefix}redirect to token endpoint ${token_endpoint}`
    )
    return reply.redirect(token_endpoint)
  }

  return callback
}
