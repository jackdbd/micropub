import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { clientMetadata } from '../../../lib/indieauth/index.js'
import {
  InvalidClientError,
  InvalidRequestError
} from '../../../lib/fastify-error-response/index.js'
import { canonicalUrl } from '../../../lib/url-canonicalization.js'
import type { AuthorizationRequestQuerystring } from '../schemas.js'

export interface Config {
  authorization_code_expiration: string
  include_error_description: boolean
  log_prefix: string
  redirect_path_on_submit: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthorizationRequestQuerystring
}

/**
 * Returns a route handler that renders a consent screen to the end user.
 *
 * The consent screen provides the user with sufficient information to make an
 * informed decision about what they are sharing with the client application and
 * allows them to **approve** or **deny** the authorization request.
 *
 * 1. The authorization endpoint fetches 'client_id' to retrieve information
 *    about the client (e.g. registered redirect URLs, name, icon, docs).
 * 2. The user authenticates and approves the request. The Authorization
 *    endpoint issues an authorization code (for single use) and builds a
 *    redirect back to client.
 *
 * @see [Authorization Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-request)
 * @see [Authorization Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [consent screen](https://indieweb.org/consent_screen)
 */
export const defAuthorizePage = (config: Config) => {
  const {
    authorization_code_expiration,
    include_error_description,
    log_prefix,
    redirect_path_on_submit
  } = config

  const authorizePage: RouteHandler<RouteGeneric> = async (request, reply) => {
    const {
      client_id,
      code_challenge,
      code_challenge_method,
      response_type,
      scope,
      state
    } = request.query

    if (response_type !== 'code') {
      const error_description = `This authorization endpoint only supports the 'code' response type.`
      // TODO: create HTML page for error_uri
      const error_uri = undefined
      const err = new InvalidRequestError({
        error_description,
        error_uri,
        state
      })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // The authorization endpoint SHOULD fetch the client_id URL to retrieve
    // application information and the client's registered redirect URLs.
    request.log.debug(`${log_prefix}fetch metadata for client ${client_id}`)
    // This function already canonicalizes the client_id URL.
    const { error: client_metadata_error, value: client_metadata } =
      await clientMetadata(client_id)

    if (client_metadata_error) {
      const original = client_metadata_error.message
      const error_description = `Failed to fetch metadata for client ${client_id}: ${original}.`
      // TODO: create HTML page for error_uri
      const error_uri = undefined
      // Which one is the most appropriate here? InvalidRequestError / InvalidClientError / ServerError
      const err = new InvalidRequestError({
        error_description,
        error_uri,
        state
      })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(client_metadata, 'retrieved IndieAuth client metadata')
    const { client_name, client_uri, logo_uri, redirect_uris } = client_metadata

    if (!redirect_uris) {
      const error_description = `Metadata of client ${client_id} does not specify redirect_uris.`
      // TODO: create HTML page for error_uri
      const error_uri = undefined
      // Which one is the most appropriate here? InvalidRequestError / InvalidClientError
      const err = new InvalidClientError({
        error_description,
        error_uri,
        state
      })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // TODO: what to do if there are multiple redirect URIs? Re-read the
    // OAuth 2.0 Dynamic Client Registration Protocol and IndieAuth to decide
    // what to do.
    if (redirect_uris.length > 1) {
      request.log.warn(
        `${log_prefix}client ID ${client_id} specifies ${redirect_uris.length} redirect URIs`
      )
    }

    // redirect_uris in IndieAuth Client Metadata
    // https://indieauth.spec.indieweb.org/#client-metadata
    // redirect_uris in OAuth 2.0 Dynamic Client Registration Protocol
    // https://www.rfc-editor.org/rfc/rfc7591.html
    const redirect_uri = redirect_uris.find(
      (uri) => uri === request.query.redirect_uri
    )

    if (!redirect_uri) {
      const error_description = `Redirect URI from query string does not match any of the redirect URIs found in the client's metadata.`
      // TODO: create HTML page for error_uri
      const error_uri = undefined
      const err = new InvalidRequestError({
        error_description,
        error_uri,
        state
      })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // URL where the IndieAuth/Micropub client is redirected to by the
    // authorization server when the end user denies the authorization request.
    // I am not sure whether there is a standard way for IndieAuth clients to
    // specify this redirect URL.
    let redirect_uri_on_deny = client_uri
    if (client_uri) {
      redirect_uri_on_deny = client_uri
    } else {
      redirect_uri_on_deny = new URL(redirect_uri).origin
    }

    const data = {
      authorization_code_expiration,
      client_id,
      client_name,
      client_uri,
      code_challenge,
      code_challenge_method,
      description: 'Authorization page with user consent screen.',
      logo_uri,
      me: canonicalUrl(request.query.me),
      redirect_path_on_submit,
      redirect_uri,
      redirect_uri_on_deny,
      scopes: scope ? scope.split(' ') : [],
      state,
      title: 'Authorize'
    }

    return reply.view('authorize.njk', data)
  }

  return authorizePage
}
