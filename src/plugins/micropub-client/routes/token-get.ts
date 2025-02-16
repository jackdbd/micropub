import {
  IntrospectionResponseBodyWhenTokenIsRetrieved,
  IntrospectionResponseBodyWhenTokenIsNotRetrieved
} from '@jackdbd/fastify-introspection-endpoint'
import { errorResponseFromJSONResponse } from '@jackdbd/indieauth'
import { UnauthorizedError } from '@jackdbd/oauth2-error-responses'
import type { RouteHandler } from 'fastify'

export interface TokenGetConfig {
  include_error_description: boolean
  introspection_endpoint: string
  log_prefix: string
}

/**
 * Invokes the introspection endpoint and renders the information received.
 *
 * @see [Access Token Verification - IndieAuth spec](https://indieauth.spec.indieweb.org/#access-token-verification)
 * @see [Introspection Endpoint - OAuth 2.0 Token Introspection (RFC 7662)](https://www.rfc-editor.org/rfc/rfc7662#section-2)
 */
export const defTokenGet = (config: TokenGetConfig) => {
  const { include_error_description, introspection_endpoint, log_prefix } =
    config

  const tokenGet: RouteHandler = async (request, reply) => {
    const access_token = request.session.get('access_token')
    // const refresh_token = request.session.get('refresh_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      const err = new UnauthorizedError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(`${log_prefix}access token extracted from session`)

    const token_type_hint = 'access_token'
    const token = access_token
    // const token_type_hint = 'refresh_token'
    // const token = refresh_token!
    request.log.debug(
      `${log_prefix}calling ${introspection_endpoint} to introspect token (token_type_hint: ${token_type_hint})`
    )

    const response = await fetch(introspection_endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ token, token_type_hint })
    })

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const payload:
      | IntrospectionResponseBodyWhenTokenIsRetrieved
      | IntrospectionResponseBodyWhenTokenIsNotRetrieved = await response.json()

    return reply.successResponse(200, {
      title: 'Token',
      description: `Page that shows the response from the token introspection endpoint.`,
      summary: `Response from the token introspection endpoint.`,
      payload
    })
  }

  return tokenGet
}
