import type { RouteHandler } from 'fastify'
import {
  invalidRequest,
  type ErrorResponseBody
} from '../../../lib/micropub/index.js'

interface RevokeConfig {
  /**
   * The access token to use to call the revocation endpoint. It may be
   * different from the token we want to revoke.
   */
  access_token: string

  revocation_endpoint: string

  /**
   * The token to revoke. It can be either an access token or a refresh token.
   */
  token: string

  token_type_hint: 'access_token' | 'refresh_token'
}

// https://indieauth.spec.indieweb.org/#token-revocation
// https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
const revoke = async (config: RevokeConfig) => {
  const { access_token, revocation_endpoint, token, token_type_hint } = config

  const response = await fetch(revocation_endpoint, {
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
    return { error: new Error(`Cannot revoke ${token_type_hint}: ${details}`) }
  }

  // On success, the revocation endpoint responds with HTTP 204 No Content.
  return { value: { message: `Token revoked (${token_type_hint})` } }
}

export interface Config {
  include_error_description: boolean
  log_prefix: string
  revocation_endpoint: string
}

/**
 * Deletes the active session and revokes both the access token and the refresh
 * token.
 *
 * @see [Token Revocation Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#token-revocation-request)
 */
export const defLogout = (config: Config) => {
  const { include_error_description, log_prefix, revocation_endpoint } = config

  const logout: RouteHandler = async (request, reply) => {
    request.log.info(`${log_prefix}Logging out`)

    // TODO: is it better to delete the session first and then revoke the
    // tokens, or the other way around?

    // There is no need to log that we are deleting the session, because
    // fastify-session already logs it for us.
    request.session.delete()

    const access_token = request.session.get('access_token')
    const refresh_token = request.session.get('refresh_token')

    // The revocation endpoint requires an authenticated request, so we need the
    // access token. If we don't have it, we cannot revoke the refresh token.
    // We revoke the refresh token first, so we can use the access token to
    // revoke itself (if we revoked the access token first, we could not make an
    // authenticated request).
    if (access_token && refresh_token) {
      request.log.debug(
        `${log_prefix}session has a refresh token. Calling ${revocation_endpoint} to revoke it...`
      )

      const { error } = await revoke({
        access_token,
        revocation_endpoint,
        token: refresh_token,
        token_type_hint: 'refresh_token'
      })

      if (error) {
        const error_description = error.message
        request.log.warn(`${log_prefix}${error_description}`)

        // At the moment my revocation endpoint does not support revoking
        // refresh tokens. For now I simply log a warning and continue.

        // const { code, body } = invalidRequest({
        //   error_description,
        //   include_error_description
        // })

        // return reply.errorResponse(code, body)
      } else {
        request.log.info(`${log_prefix}refresh token revoked`)
      }
    }

    if (access_token) {
      request.log.debug(
        `${log_prefix}session has an access token. Calling ${revocation_endpoint} to revoke it...`
      )

      const { error } = await revoke({
        access_token,
        revocation_endpoint,
        token: access_token,
        token_type_hint: 'access_token'
      })

      if (error) {
        const error_description = error.message
        request.log.warn(`${log_prefix}${error_description}`)

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return reply.errorResponse(code, body)
      }

      request.log.info(`${log_prefix}access token revoked`)
    }

    return reply.redirect('/')
  }

  return logout
}
