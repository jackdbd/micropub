import { OAuth2Namespace } from '@fastify/oauth2'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import { errorMessageFromJSONResponse } from '../../../lib/oauth2/index.js'

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
const revokeIndieAuth = async (config: RevokeConfig) => {
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
    const msg = await errorMessageFromJSONResponse(response)
    return { error: new Error(`Cannot revoke ${token_type_hint}: ${msg}`) }
  }

  // On success, the revocation endpoint responds with HTTP 204 No Content.
  return { value: { message: `Token revoked (${token_type_hint})` } }
}

export interface Config {
  include_error_description: boolean
  log_prefix: string
  revocation_endpoint?: string
}

const revokeGitHub = async (
  githubOAuth2: OAuth2Namespace,
  access_token: string
) => {
  // https://github.com/fastify/fastify-oauth2?tab=readme-ov-file#utilities
  await githubOAuth2.revokeToken(
    {
      token_type: 'Bearer',
      access_token,
      expires_in: 123,
      expires_at: new Date()
    },
    'access_token',
    undefined
  )
}

/**
 * Deletes the active session and revokes both the access token and the refresh
 * token.
 *
 * @see [Token Revocation Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#token-revocation-request)
 */
export const defLogout = (config: Config) => {
  const { include_error_description, log_prefix } = config

  return async function (
    this: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    request.log.info(`${log_prefix}Logging out`)

    // TODO: is it better to delete the session first and then revoke the
    // tokens, or the other way around? See if the specs say anything about it.
    request.session.regenerate()

    // There is no need to log that we are deleting the session, because
    // fastify-session already logs it for us.
    request.session.delete()

    const access_token = request.session.get('access_token')
    const refresh_token = request.session.get('refresh_token')

    // TODO: revoke the tokens by calling the appropriate revocation endpoint.
    // i.e.
    // - revoke a token issued by GitHub by calling GitHub's revocation endpoint,
    // - revoke a token issued by an IndieAuth server by calling the IndieAuth revocation endpoint.

    if (access_token) {
      request.log.debug(`${log_prefix}call GitHub token revocation endpoint`)
      try {
        await revokeGitHub(this.githubOAuth2, access_token)
        request.log.debug(`${log_prefix}GitHub token revoked`)
      } catch (err: any) {
        request.log.error(
          `${log_prefix}GitHub token NOT revoked: ${err.message}`
        )
      } finally {
        return reply.redirect('/')
      }
    }

    let revocation_endpoint = config.revocation_endpoint
    if (!revocation_endpoint) {
      request.log.debug(
        `${log_prefix}revocation_endpoint not provided in config. Trying to find it in the session.`
      )
      revocation_endpoint = request.session.get('revocation_endpoint')
    }

    // As described in [RFC7009], the revocation endpoint responds with HTTP 200
    // for both the case where the token was successfully revoked, or if the
    // submitted token was invalid.
    // https://indieauth.spec.indieweb.org/#token-revocation
    // I am not sure whether to consider not having a revocation endpoint an
    // error condition or not. For now I am simply logging a warning.
    if (!revocation_endpoint) {
      const warning = `Revocation endpoint not set. It was neither provided in the configuration, nor it was found in the session.`
      request.log.warn(`${log_prefix}${warning}`)
      return reply.redirect('/')
    }

    // The revocation endpoint requires an authenticated request, so we need the
    // access token. If we don't have it, we cannot revoke the refresh token.
    // We revoke the refresh token first, so we can use the access token to
    // revoke itself (if we revoked the access token first, we could not make an
    // authenticated request).
    if (access_token && refresh_token) {
      request.log.debug(
        `${log_prefix}session has a refresh token. Calling ${revocation_endpoint} to revoke it...`
      )

      const { error } = await revokeIndieAuth({
        access_token,
        revocation_endpoint,
        token: refresh_token,
        token_type_hint: 'refresh_token'
      })

      if (error) {
        const error_description = error.message
        request.log.warn(`${log_prefix}${error_description}`)

        // TODO: at the moment my revocation endpoint does not support revoking
        // refresh tokens. For now I simply log a warning and continue.
        // throw new InvalidRequestError({ error_description })
      } else {
        request.log.info(`${log_prefix}refresh token revoked`)
      }
    }

    if (access_token) {
      request.log.debug(
        `${log_prefix}session has an access token. Calling ${revocation_endpoint} to revoke it...`
      )

      const { error } = await revokeIndieAuth({
        access_token,
        revocation_endpoint,
        token: access_token,
        token_type_hint: 'access_token'
      })

      if (error) {
        const error_description = error.message
        const err = new InvalidRequestError({ error_description })
        return reply.errorResponse(
          err.statusCode,
          err.payload({ include_error_description })
        )
      }

      request.log.info(`${log_prefix}access token revoked`)
    }

    return reply.redirect('/')
  }
}
