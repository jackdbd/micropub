import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { clientMetadata } from '../../../lib/indieauth/index.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import type { AuthorizationRequestQuerystring } from './schemas.js'

export interface Config {
  authorization_code_expiration: string
  include_error_description: boolean
  log_prefix: string
  redirect_url_on_deny: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthorizationRequestQuerystring
}

/**
 * Displays a consent screen that provides the user with sufficient information
 * to make an informed decision about what they are sharing with the client
 * application and allows them to approve or deny the request.
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
export const defAuthorizeGet = (config: Config) => {
  const {
    authorization_code_expiration,
    include_error_description,
    log_prefix,
    redirect_url_on_deny
  } = config

  const authorize: RouteHandler<RouteGeneric> = async (request, reply) => {
    const {
      client_id,
      code_challenge,
      code_challenge_method,
      me,
      response_type,
      scope,
      state
    } = request.query

    if (response_type !== 'code') {
      const error_description = `This authorization endpoint only supports the 'code' response type.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
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
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(client_metadata, 'retrieved IndieAuth client metadata')
    const { client_name, client_uri, logo_uri, redirect_uris } = client_metadata

    if (!redirect_uris) {
      const error_description = `Metadata of client ID ${client_id} does not specify redirect_uris.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const redirect_uri = redirect_uris.find(
      (uri) => uri === request.query.redirect_uri
    )

    if (!redirect_uri) {
      const error_description = `Redirect URI from query string does not match any of the redirect URIs found in the client's metadata.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
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
      me,
      redirect_uri,
      redirect_url_on_deny,
      scopes: scope ? scope.split(' ') : [],
      state,
      title: 'Authorize'
    }

    // request.log.debug(data, `${log_prefix}render authorize.njk with this data`)
    return reply.view('authorize.njk', data)
  }

  return authorize
}
