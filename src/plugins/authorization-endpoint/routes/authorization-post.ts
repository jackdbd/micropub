import type { RouteHandler } from 'fastify'
import type { MarkCodeAsUsed } from '../../../lib/authorization-code-storage-interface/index.js'
import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import type { AuthPostRequestBody } from './schemas.js'

const ME = 'https://giacomodebidda.com/'
const SCOPE = 'profile email create update delete undelete media'

export interface Config {
  log_prefix: string
  markAuthorizationCodeAsUsed: MarkCodeAsUsed
}

/**
 * Verifies the authorization code and marks it as used.
 *
 * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 * @see [Verifying the authorization code - indieweb.org](https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code)
 */
export const defAuthPost = (config: Config) => {
  const { log_prefix, markAuthorizationCodeAsUsed } = config

  const authPost: RouteHandler<{ Body: AuthPostRequestBody }> = async (
    request,
    reply
  ) => {
    request.log.warn(
      { body: request.body, query: request.query },
      `${log_prefix}TODO: verify authorization code`
    )

    request.log.warn(`${log_prefix}TODO: verify that 'code' is not expired`)

    request.log.warn(
      `${log_prefix}TODO: verify that 'code' was issued for 'client_id' and 'redirect_uri'`
    )

    request.log.warn(
      `${log_prefix}TODO: verify that 'code' was issued with at least one scope`
    )

    const { client_id, code } = request.body
    // const { client_id, code, code_verifier, grant_type, redirect_uri } = request.body
    const { error, value } = await markAuthorizationCodeAsUsed(code)

    if (error) {
      const original = error.message
      const error_description = `Error while verifying the authorization code. ${original}`
      throw new InvalidRequestError({ error_description })
    }

    request.log.warn(
      value,
      `${log_prefix}marked authorization code as used by client ${client_id}`
    )

    return reply.code(200).send({ me: ME, scope: SCOPE })
  }

  return authPost
}
