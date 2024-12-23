import type { RouteGenericInterface, RouteHandler } from 'fastify'
import ms, { StringValue } from 'ms'
import { unixTimestampInMs } from '../../../lib/date.js'
import {
  authorizationResponseUrl,
  clientMetadata
} from '../../../lib/indieauth/index.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import type { IssueCode } from '../../../lib/authorization-code-storage-interface/index.js'
import type { AuthGetRequestQuerystring } from './schemas.js'

export interface Config {
  access_token_expiration: string
  authorization_code_expiration: string
  issueCode: IssueCode
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
  refresh_token_expiration: string
}

// IndieLogin.com, when choosing the GitHub as the authentication provider
// (RelMeAuth), redirects the user here:
// https://indieauth.com/auth/start?
// me=https%3A%2F%2Fgiacomodebidda.com%2F
// provider=github
// profile=https%3A%2F%2Fgithub.com%2Fjackdbd
// redirect_uri=https%3A%2F%2Findielogin.com%2Fredirect%2Findieauth

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthGetRequestQuerystring
}

/**
 * Authorizes a client and issues a single-use authorization code.
 *
 * 1. The authorization endpoint fetches 'client_id' to retrieve information
 *    about the client (e.g. registered redirect URLs, name, icon, docs).
 * 2. The user authenticates and approves the request. The Authorization
 *    endpoint issues an authorization code (for single use), builds a redirect
 *    back to client.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization request - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-request)
 * @see [Authorization response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [consent screen](https://indieweb.org/consent_screen)
 */
export const defAuthGet = (config: Config) => {
  const {
    access_token_expiration,
    authorization_code_expiration,
    issueCode,
    issuer,
    log_prefix,
    refresh_token_expiration
  } = config

  const authGet: RouteHandler<RouteGeneric> = async (request, reply) => {
    const {
      client_id,
      code_challenge,
      code_challenge_method,
      me,
      response_type,
      scope
    } = request.query

    if (response_type !== 'code') {
      const error_description = `This authorization endpoint only supports the 'code' response type.`
      throw new InvalidRequestError({ error_description })
    }

    // The authorization endpoint SHOULD fetch the client_id URL to retrieve
    // application information and the client's registered redirect URLs.
    request.log.debug(
      `${log_prefix}fetch IndieAuth client metadata from client_id ${client_id}`
    )
    // This function already canonicalizes the client_id URL.
    const { error: client_metadata_error, value: client_metadata } =
      await clientMetadata(client_id)

    if (client_metadata_error) {
      const original = client_metadata_error.message
      const error_description = `Failed to fetch client metadata: ${original}.`
      throw new ServerError({ error_description })
    }

    request.log.debug(client_metadata, 'retrieved IndieAuth client metadata')
    const { client_name, client_uri, logo_uri, redirect_uris } = client_metadata

    if (!redirect_uris) {
      const error_description = `Metadata of client ID ${client_id} does not contain redirect_uris.`
      throw new ServerError({ error_description })
    }

    const redirect_uri = redirect_uris.find(
      (uri) => uri === request.query.redirect_uri
    )

    if (!redirect_uri) {
      const error_description = `Redirect URI from query string does not match any of the client's registered redirect URIs.`
      throw new InvalidRequestError({ error_description })
    }

    // TODO: the authorization code should be generated AFTER the user has
    // approved the request.

    const { code, iss, state } = authorizationResponseUrl({
      iss: issuer,
      redirect_uri,
      state: request.query.state
    })

    const exp =
      (unixTimestampInMs() + ms(authorization_code_expiration as StringValue)) /
      1000

    const result = await issueCode({ code, exp })
    request.log.warn(result, `${log_prefix}issued authorization code`)

    const data = {
      access_token_expiration,
      authorization_code_expiration,
      client_id,
      client_name,
      client_uri,
      code_challenge,
      code_challenge_method,
      description: 'User consent screen',
      code,
      iss,
      logo_uri,
      me,
      redirect_uri,
      refresh_token_expiration,
      scopes: scope.split(' '),
      state,
      title: 'Consent'
    }

    request.log.debug(data, `${log_prefix}render consent.njk with this data`)
    return reply.view('consent.njk', data)
  }

  return authGet
}
