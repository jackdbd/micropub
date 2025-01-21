import type { RouteGenericInterface, RouteHandler } from 'fastify'
import ms, { StringValue } from 'ms'
import { unixTimestampInMs } from '../../../lib/date.js'
import { ServerError } from '@jackdbd/oauth2-error-responses'
import { authorizationResponseUrl } from '@jackdbd/indieauth'
import canonicalUrl from '@jackdbd/canonical-url'
import type {
  HandleActionQuerystring,
  OnUserApprovedRequest
} from '../schemas.js'

export interface Config {
  authorization_code_expiration: string

  include_error_description: boolean

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

  onUserApprovedRequest: OnUserApprovedRequest
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: HandleActionQuerystring
}

/**
 * Handles the action performed by the end user on the consent screen.
 *
 * If the user **approved** the authorization request:
 *
 * 1. it issues an authorization code
 * 2. it redirects the client to `redirect_uri`
 *
 * If the user **denied** the authorization request:
 *
 * 1 it redirects the client to `redirect_uri_on_deny`
 *
 * Before issuing an authorization code, the authorization server MUST first
 * verify the identity of the resource owner. This means that only authenticated
 * user should be able to call this endpoint.
 *
 * @see [consent screen](https://indieweb.org/consent_screen)
 */
export const defHandleAction = (config: Config) => {
  const {
    authorization_code_expiration,
    include_error_description,
    issuer,
    log_prefix,
    onUserApprovedRequest
  } = config

  const handleAction: RouteHandler<RouteGeneric> = async (request, reply) => {
    const {
      action,
      client_id,
      code_challenge,
      code_challenge_method,
      redirect_uri,
      redirect_uri_on_deny,
      scope,
      state
    } = request.query

    request.log.debug(
      request.query,
      `${log_prefix}query string received at the consent page`
    )

    if (action && action === 'deny') {
      request.log.debug(
        `${log_prefix}user denied the authorization request; redirecting to ${redirect_uri_on_deny}`
      )
      return reply.redirect(redirect_uri_on_deny)
    }

    request.log.debug(
      `${log_prefix}user approved the authorization request; generating authorization response URL`
    )

    const auth = authorizationResponseUrl({
      iss: issuer,
      redirect_uri,
      state
    })

    if (state !== auth.state) {
      const error_description = `The state (CSRF token) returned by the authorization response URL does not match the state sent by client ${client_id}`
      // TODO: create HTML page for error_uri
      const error_uri = undefined
      const err = new ServerError({ error_description, error_uri, state })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { code, iss, redirect_url } = auth

    // TODO: should I verify iss? And should I store it in the authorization code record?

    const exp = Math.floor(
      (unixTimestampInMs() + ms(authorization_code_expiration as StringValue)) /
        1000
    )

    const me = canonicalUrl(request.query.me)

    const props = {
      client_id,
      code_challenge,
      code_challenge_method,
      exp,
      iss,
      me,
      redirect_uri,
      scope
    }

    try {
      await onUserApprovedRequest({ ...props, code })
    } catch (ex: any) {
      let error_description = `The user-provided onUserApprovedRequest handler threw an exception.`
      if (ex && ex.message) {
        error_description = `${error_description} Here is the original error message: ${ex.message}`
      }
      request.log.error(`${log_prefix}${error_description}`)
      const error_uri = undefined
      const err = new ServerError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
      // TODO: redirect to an error page when the user-provided handler throws
      // an exception. Do not return a JSON response.
      // reply.redirect(redirect_url)
    }

    request.log.debug(
      `${log_prefix}stored record about authorization code ${code}`
    )

    request.log.debug(`${log_prefix}redirect to ${redirect_url}`)
    reply.redirect(redirect_url)
  }

  return handleAction
}
