import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type {
  MarkAuthorizationCodeAsUsed,
  RetrieveAuthorizationCode
} from '../../../lib/authorization-code-storage-interface/index.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import { isExpired } from '../../../lib/predicates.js'
import type { AccessTokenRequestBody } from './schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: AccessTokenRequestBody
}

export interface Config {
  include_error_description: boolean
  log_prefix: string
  markAuthorizationCodeAsUsed: MarkAuthorizationCodeAsUsed
  retrieveAuthorizationCode: RetrieveAuthorizationCode
}

/**
 * Verifies an authorization code and marks it as used.
 *
 * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 * @see [Verifying the authorization code - indieweb.org](https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code)
 */
export const defAuthorizePost = (config: Config) => {
  const {
    include_error_description,
    log_prefix,
    markAuthorizationCodeAsUsed,
    retrieveAuthorizationCode
  } = config

  const authorize: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { client_id, code, redirect_uri } = request.body

    const { error: read_error, value: record } =
      await retrieveAuthorizationCode(code)

    if (read_error) {
      const original = read_error.message
      const error_description = `Error while verifying the authorization code. ${original}`
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { exp, me, scope } = record

    request.log.debug(`${log_prefix}verifying that 'code' is not expired`)
    if (isExpired(exp)) {
      const error_description = `Authorization code is expired.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${log_prefix}verifying that 'code' was issued for 'client_id'`
    )
    if (client_id !== record.client_id) {
      const error_description = `Authorization code was issued for client_id ${record.client_id}, not ${client_id}.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${log_prefix}verifying that 'code' was issued for 'redirect_uri'`
    )
    if (redirect_uri !== record.redirect_uri) {
      const error_description = `Authorization code was issued for redirect_uri ${record.redirect_uri}, not ${redirect_uri}.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // The authorization and token endpoints allow the client to specify the
    // scope of the access request using the "scope" request parameter.
    //
    // OAuth 2.0 says this:
    // If the client omits the scope parameter when requesting authorization,
    // the authorization server MUST either process the request using a
    // pre-defined default value or fail the request indicating an invalid scope.
    // https://datatracker.ietf.org/doc/html/rfc6749#section-3.3
    //
    // IndieAuth says this:
    // If the authorization code was issued with no scope, the token endpoint
    // MUST NOT issue an access token, as empty scopes are invalid per Section
    // 3.3 of OAuth 2.0.
    // https://indieauth.spec.indieweb.org/#access-token-response
    request.log.debug(
      `${log_prefix}verifying that 'code' was issued with at least one scope`
    )
    const scopes = scope.split(' ')
    if (scopes.length < 1) {
      const error_description = `Authorization code was issued with no scopes.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(`${log_prefix}verified authorization code`)

    const { error, value } = await markAuthorizationCodeAsUsed(code)

    if (error) {
      const original = error.message
      const error_description = `Error while marking the authorization code as used. ${original}`
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      value,
      `${log_prefix}marked authorization code as used by client_id ${client_id}`
    )

    // TODO: implement this.
    // If the client only needs to know the user who logged in, the client will
    // exchange the authorization code at the authorization endpoint, and only
    // the canonical user profile URL and possibly profile information is returned.
    // https://indieauth.spec.indieweb.org/#profile-information

    return reply.code(200).send({ me, scope })
  }

  return authorize
}
