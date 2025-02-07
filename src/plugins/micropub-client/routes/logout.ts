import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { errorResponseFromJSONResponse } from '@jackdbd/indieauth'

export interface Config {
  include_error_description: boolean
  log_prefix: string
  redirect_url?: string
  revocation_endpoint?: string
}

// const revokeGitHub = async (
//   githubOAuth2: OAuth2Namespace,
//   access_token: string
// ) => {
//   // https://github.com/fastify/fastify-oauth2?tab=readme-ov-file#utilities
//   await githubOAuth2.revokeToken(
//     {
//       token_type: 'Bearer',
//       access_token,
//       expires_in: 123,
//       expires_at: new Date()
//     },
//     'access_token',
//     undefined
//   )
// }

/**
 * Deletes the active session and revokes both the access token and the refresh
 * token.
 *
 * @see [Token Revocation Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#token-revocation-request)
 */
export const defLogout = (config: Config) => {
  const { include_error_description, log_prefix } = config
  const redirect_url = config.redirect_url || '/'

  return async function (
    this: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    request.log.info(`${log_prefix}logging out`)

    // TODO: is it better to delete the session first and then revoke the
    // tokens, or the other way around? See if the specs say anything about it.
    // request.session.regenerate()

    const access_token = request.session.get('access_token')

    // Revoke the tokens by calling the appropriate revocation endpoint:
    // - revoke a token issued by GitHub by calling GitHub's revocation endpoint,
    // - revoke a token issued by an IndieAuth server by calling the IndieAuth revocation endpoint.

    // if (github_access_token) {
    //   request.log.debug(`${log_prefix}call GitHub token revocation endpoint`)
    //   try {
    //     await revokeGitHub(this.githubOAuth2, github_access_token)
    //     request.log.debug(`${log_prefix}GitHub access token revoked`)
    //   } catch (err: any) {
    //     request.log.error(
    //       `${log_prefix}GitHub access token NOT revoked: ${err.message}`
    //     )
    //   } finally {
    //     return reply.redirect(redirect_url)
    //   }
    // }

    let revocation_endpoint = config.revocation_endpoint
    if (!revocation_endpoint) {
      request.log.debug(
        `${log_prefix}revocation_endpoint not provided in config. Trying to find it in the session.`
      )
      revocation_endpoint = request.session.get('revocation_endpoint')
    }

    // I am not sure whether to consider not having a revocation endpoint an
    // error condition or not. For now I am simply logging a warning.
    if (!revocation_endpoint) {
      const warning = `revocation endpoint not set. It was neither provided in the configuration, nor it was found in the session.`
      request.log.warn(`${log_prefix}${warning}`)
      return reply.redirect(redirect_url)
    }

    if (access_token) {
      request.log.debug(
        `${log_prefix}session has an access token. Calling ${revocation_endpoint} to revoke it...`
      )

      try {
        const response = await fetch(revocation_endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            token: access_token,
            token_type_hint: 'access_token',
            revocation_reason: 'logout'
          })
        })

        if (!response.ok) {
          const err = await errorResponseFromJSONResponse(response)
          return reply.errorResponse(
            err.statusCode,
            err.payload({ include_error_description })
          )
        }

        request.log.info(`${log_prefix}access token revoked`)
      } catch (ex: any) {
        request.log.error(
          `${log_prefix}cannot revoke access token: ${ex.message}`
        )
      }
    }

    // There is no need to log that we are deleting the session, because
    // fastify-session already logs it for us.
    request.session.delete()

    return reply.redirect(redirect_url)
  }
}
