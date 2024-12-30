import type { RouteGenericInterface, RouteHandler } from 'fastify'
import ms, { StringValue } from 'ms'
import type { StoreAuthorizationCode } from '../../../lib/authorization-code-storage-interface/index.js'
import { unixTimestampInMs } from '../../../lib/date.js'
import { ServerError } from '../../../lib/fastify-errors/index.js'
import { authorizationResponseUrl } from '../../../lib/indieauth/index.js'
import { canonicalUrl } from '../../../lib/url-canonicalization.js'
import type { ConsentRequestQuerystring } from './schemas.js'

export interface Config {
  authorization_code_expiration: string

  /**
   * Issuer identifier. This is optional in OAuth 2.0 servers, but required in
   * IndieAuth servers. If specified, it will be included as the `iss` query
   * parameter in the authorization response.
   *
   * See also the `authorization_response_iss_parameter_supported` parameter in
   * [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata).
   */
  issuer?: string

  log_prefix: string

  redirect_url_on_deny: string

  storeAuthorizationCode: StoreAuthorizationCode
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: ConsentRequestQuerystring
}

/**
 * Issues an authorization code and redirects the user back to the redirect URI.
 *
 * Before issuing an authorization code, the authorization server MUST first
 * verify the identity of the resource owner.
 *
 * @see [consent screen](https://indieweb.org/consent_screen)
 */
export const defConsent = (config: Config) => {
  const {
    authorization_code_expiration,
    issuer,
    log_prefix,
    redirect_url_on_deny,
    storeAuthorizationCode
  } = config

  const consent: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { action, client_id, redirect_uri, scope } = request.query

    if (action && action === 'deny') {
      request.log.warn(`${log_prefix}user denied the authorization request`)
      return reply.redirect(redirect_url_on_deny)
    }

    const { code, redirect_url } = authorizationResponseUrl({
      iss: issuer,
      redirect_uri,
      state: request.query.state
    })

    const exp = Math.floor(
      (unixTimestampInMs() + ms(authorization_code_expiration as StringValue)) /
        1000
    )

    const me = canonicalUrl(request.query.me)

    const { error, value } = await storeAuthorizationCode({
      client_id,
      code,
      exp,
      me,
      redirect_uri,
      scope
    })

    if (error) {
      const error_description = error.message
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description: true }))
    }

    const message = value.message
      ? `stored authorization code: ${value.message}`
      : 'stored authorization code'

    request.log.debug(`${log_prefix}${message}`)

    request.log.debug(`${log_prefix}redirect to ${redirect_url}`)
    reply.redirect(redirect_url)
  }

  return consent
}
