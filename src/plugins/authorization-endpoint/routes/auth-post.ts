import type { RouteHandler } from 'fastify'
import type { MarkCodeAsUsed } from '../../../lib/authorization-code-storage-interface/index.js'
import { invalidRequest } from '../../../lib/micropub/error-responses.js'
import type { AuthPostRequestBody } from './schemas.js'

const ME = 'https://giacomodebidda.com/'
const SCOPE = 'profile email create update delete undelete media'

export interface Config {
  include_error_description: boolean
  log_prefix: string
  markAuthorizationCodeAsUsed: MarkCodeAsUsed
}

/**
 * Verifies the authorization code and marks it as used.
 *
 * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 */
export const defAuthPost = (config: Config) => {
  const { include_error_description, log_prefix, markAuthorizationCodeAsUsed } =
    config

  const authPost: RouteHandler<{ Body: AuthPostRequestBody }> = async (
    request,
    reply
  ) => {
    request.log.warn(
      { body: request.body, params: request.params, query: request.query },
      `${log_prefix}TODO: verify that authorization code was issued for this client_id`
    )

    const { client_id, code } = request.body
    // const { client_id, code, code_verifier, grant_type, redirect_uri } = request.body
    const { error, value } = await markAuthorizationCodeAsUsed(code)

    if (error) {
      const original = error.message
      const error_description = `Error while verifying the authorization code. ${original}`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.warn(
      value,
      `${log_prefix}marked authorization code as used by client ${client_id}`
    )

    // const { client_id, code, redirect_uri } = request.body
    // request.log.warn(request.body, `${log_prefix}request body`)

    // 'Content-Type': 'application/x-www-form-urlencoded'
    // URLSearchParams({ client_id, code, redirect_uri })

    return reply.code(200).send({ me: ME, scope: SCOPE })
  }

  return authPost
}
