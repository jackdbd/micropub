import type { RouteHandler } from 'fastify'
// import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import { errorResponseFromJSONResponse } from '../../../lib/oauth2/index.js'
import type { IntrospectionResponseBodySuccess } from '../../introspection-endpoint/index.js'

export interface Config {
  authorization_endpoint?: string
  client_id: string
  client_logo_uri: string
  client_name: string
  client_uri: string
  include_error_description: boolean
  introspection_endpoint?: string
  log_prefix: string
  redirect_path_on_error: string
  redirect_path_on_submit: string
  redirect_path_on_success: string
  redirect_uri: string
  revocation_endpoint?: string
  token_endpoint?: string
}

/**
 * Renders a page that has a form for refreshing an access token.
 *
 * @see [Refreshing an Access Token](https://datatracker.ietf.org/doc/html/rfc6749#section-6)
 */
export const defRefreshAccessToken = (config: Config) => {
  const {
    client_id,
    client_logo_uri,
    client_name,
    client_uri,
    include_error_description,
    log_prefix,
    redirect_path_on_error,
    redirect_path_on_submit: submit_path,
    redirect_path_on_success,
    redirect_uri
  } = config

  const refreshAccessToken: RouteHandler = async (request, reply) => {
    const refresh_token = request.session.get('refresh_token')

    if (!refresh_token) {
      request.log.debug(
        `${log_prefix}refresh token not found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    let authorization_endpoint = config.authorization_endpoint
    if (!authorization_endpoint) {
      request.log.debug(
        `${log_prefix}authorization_endpoint not provided in config. Trying to find it in the session.`
      )
      authorization_endpoint = request.session.get('authorization_endpoint')
    }

    if (!authorization_endpoint) {
      request.log.debug(
        `${log_prefix}authorization_endpoint not found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    let token_endpoint = config.token_endpoint
    if (!token_endpoint) {
      request.log.debug(
        `${log_prefix}token_endpoint not provided in config. Trying to find it in the session.`
      )
      token_endpoint = request.session.get('token_endpoint')
    }

    if (!token_endpoint) {
      request.log.debug(
        `${log_prefix}token_endpoint not found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    let revocation_endpoint = config.revocation_endpoint
    if (!revocation_endpoint) {
      request.log.debug(
        `${log_prefix}revocation_endpoint not provided in config. Trying to find it in the session.`
      )
      revocation_endpoint = request.session.get('revocation_endpoint')
    }

    if (!revocation_endpoint) {
      request.log.debug(
        `${log_prefix}revocation_endpoint not found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    let me: string | undefined
    let scope: string | undefined
    let jti: string | undefined

    request.log.warn(
      `${log_prefix}retrieving access token from session and calling introspection endpoint for decoding access token claims`
    )
    const access_token = request.session.get('access_token')

    if (access_token) {
      let introspection_endpoint = config.introspection_endpoint
      if (!introspection_endpoint) {
        request.log.debug(
          `${log_prefix}introspection_endpoint not provided in config. Trying to find it in the session.`
        )
        introspection_endpoint = request.session.get('introspection_endpoint')
      }

      if (!introspection_endpoint) {
        request.log.debug(
          `${log_prefix}introspection_endpoint not found in session; redirecting to ${redirect_path_on_error}`
        )
        return reply.redirect(redirect_path_on_error)
      }

      const response = await fetch(introspection_endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          token: access_token,
          token_type_hint: 'access_token'
        })
      })

      if (!response.ok) {
        const err = await errorResponseFromJSONResponse(response)
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      const access_token_introspection: IntrospectionResponseBodySuccess =
        await response.json()

      me = access_token_introspection.me
      scope = access_token_introspection.scope
      jti = access_token_introspection.jti
    }

    if (!me) {
      request.log.debug(
        `${log_prefix}parameter 'me' not set; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    if (!scope) {
      request.log.debug(
        `${log_prefix}parameter 'scope' not set; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    if (!jti) {
      request.log.debug(
        `${log_prefix}parameter 'jti' not set; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    const scopes = scope.split(' ')

    const data = {
      authorization_endpoint,
      client_id,
      client_logo_uri,
      client_name,
      client_uri,
      description: 'Page to start the OAuth 2.0 Refresh Token flow.',
      jti,
      me,
      redirect_path_on_success,
      redirect_uri,
      refresh_token,
      revocation_endpoint,
      scope,
      scopes,
      submit_path,
      title: 'Refresh access token',
      token_endpoint
    }

    return reply.view('refresh-access-token.njk', data)
  }

  return refreshAccessToken
}
