import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  InvalidRequestError,
  InvalidTokenError,
  ServerError,
  UnauthorizedError
} from '../../../lib/fastify-errors/index.js'
import { errorMessageFromJSONResponse } from '../../../lib/oauth2/index.js'
import { safeDecode } from '../../../lib/token/decode.js'
import { AccessTokenClaims } from '../../../lib/token/claims.js'
import type { AuthorizationResponseQuerystring } from '../../authorization-endpoint/index.js'
import type { AccessTokenResponseBodySuccess } from '../../token-endpoint/index.js'

export interface Config {
  client_id: string
  include_error_description: boolean
  log_prefix: string
  redirect_uri: string
  token_endpoint?: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthorizationResponseQuerystring
}

/**
 * Authorization callback for the IndieAuth flow. Users will be redirected here
 * by the authorization endpoint after they approve the authorization request.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 */
export const defAuthorizationCallback = (config: Config) => {
  const { client_id, include_error_description, log_prefix, redirect_uri } =
    config

  const authorizationCallback: RouteHandler<RouteGeneric> = async (
    request,
    reply
  ) => {
    const session_data = { code_verifier: '', issuer: '', state: '' }
    type SessionKey = keyof typeof session_data
    for (const key of Object.keys(session_data) as SessionKey[]) {
      const value = request.session.get(key)
      if (value) {
        session_data[key] = value
      } else {
        const error_description = `Key '${key}' not found in session or it is undefined.`
        const err = new InvalidRequestError({ error_description })
        const payload = err.payload({ include_error_description })
        return reply.errorResponse(err.statusCode, payload)
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
        const err = new InvalidRequestError({ error_description })
        const payload = err.payload({ include_error_description })
        return reply.errorResponse(err.statusCode, payload)
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
      const err = new InvalidRequestError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
    }

    request.log.debug(
      `${log_prefix}issuer verified: 'iss' in query string matches 'issuer' found in session`
    )

    if (session_data.state !== query_data.state) {
      const error_description = `Parameter 'state' found in query string does not match key 'state' found in session.`
      const err = new InvalidRequestError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
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

    // TODO: implement this.
    // If the client only needs to know the user who logged in, the client will
    // exchange the authorization code at the authorization endpoint, and only
    // the canonical user profile URL and possibly profile information is returned.

    // TODO: implement this behavior.
    // Once the client has obtained an authorization code, it can redeem it for
    // an access token OR the user's final profile URL.
    // This means that not knowing the token endpoint here should NOT result in
    // an error. It should mean that the client can ONLY authenticate the user,
    // and not authorize him/her.
    // https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code
    // See how it's implemented here:
    // https://github.com/simonw/datasette-indieauth

    if (!token_endpoint) {
      const error_description = `Token endpoint not set. It was neither provided in the configuration, nor it was found in the session.`
      const err = new InvalidRequestError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
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
      const msg = await errorMessageFromJSONResponse(response)
      const error_description = `Failed to exchange authorization code for access token: ${msg}`
      const err = new InvalidRequestError({ error_description })
      const payload = err.payload({ include_error_description })
      // return reply
      //   .code(err.statusCode)
      //   .send(err.payload({ include_error_description }))
      return reply.errorResponse(err.statusCode, payload)
    }

    let access_token: string | undefined
    let refresh_token: string | undefined
    try {
      const res_body: AccessTokenResponseBodySuccess = await response.json()
      access_token = res_body.access_token
      refresh_token = res_body.refresh_token
    } catch (ex: any) {
      const error_description = `Failed to parse the JSON response received from the token endpoint: ${ex.message}`
      // I don't think it's the client's fault if we cann't parse the response
      // body, so we return a generic server error.
      const err = new ServerError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
    }

    if (!access_token) {
      const error_description = `Response body from token endpoint has no access_token parameter.`
      const err = new UnauthorizedError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
    }

    request.session.set('access_token', access_token)
    request.log.debug(`${log_prefix}set access token in session`)

    if (refresh_token) {
      request.session.set('refresh_token', refresh_token)
      request.log.debug(`${log_prefix}set refresh token in session`)
    }

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      const error_description = `Error while decoding access token: ${decode_error.message}`
      // Which one is more appropriate? UnauthorizedError or InvalidTokenError?
      const err = new InvalidTokenError({ error_description })
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
    }

    request.session.set('claims', claims)
    request.log.debug(`${log_prefix}set decoded claims in session`)

    // TODO: make it another configuration parameter. Maybe it should 'claims' by default.
    // Also, should I set this in the request context or in the session?
    // session.set(claims_session_key as keyof SessionData, claims)
    // request.log.debug(
    //   `${prefix}set access token decoded claims in session '${session_key}', key '${claims_session_key}'`
    // )

    // const provider = 'indieauth'
    // request.log.debug(`${log_prefix}redirect to /user?provider=${provider}`)
    const redirect_path = `/token`
    request.log.debug(`${log_prefix}redirect to ${redirect_path}`)
    return reply.redirect(redirect_path)
  }

  return authorizationCallback
}
