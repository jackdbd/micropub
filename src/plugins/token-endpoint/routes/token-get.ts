import type { RouteHandler } from 'fastify'
import {
  invalidRequest,
  unauthorized
} from '../../../lib/micropub/error-responses.js'
import { ErrorResponseBody } from '../../../lib/micropub/error.js'

export interface TokenGetConfig {
  include_error_description: boolean
  introspection_endpoint: string
  log_prefix: string
}

/**
 * Invokes the introspection endpoint and renders the information received.
 *
 * @see [Access Token Verification - IndieAuth spec](https://indieauth.spec.indieweb.org/#access-token-verification)
 * @see [Introspection Endpoint - OAuth 2.0 Token Introspection (RFC7662)](https://www.rfc-editor.org/rfc/rfc7662#section-2)
 */
export const defTokenGet = (config: TokenGetConfig) => {
  const { include_error_description, introspection_endpoint, log_prefix } =
    config

  const tokenGet: RouteHandler = async (request, reply) => {
    const access_token = request.session.get('access_token')
    // const refresh_token = request.session.get('refresh_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}access token extracted from session`)

    const token_type_hint = 'access_token'
    const token = access_token
    // const token_type_hint = 'refresh_token'
    // const token = refresh_token!
    request.log.warn(
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
      const err_res_body: ErrorResponseBody = await response.json()

      const details =
        err_res_body.error_description ??
        `${response.statusText} (${response.status})`

      const error_description = `Cannot introspect ${token_type_hint}: ${details}`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const introspection_response_body = await response.json()

    return reply.successResponse(200, {
      title: 'Token introspection',
      description: 'Token introspection success page',
      summary: 'Response from the token introspection endpoint.',
      payload: introspection_response_body
    })
  }

  return tokenGet
}
