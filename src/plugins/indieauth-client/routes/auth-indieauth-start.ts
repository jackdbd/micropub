import assert from 'node:assert'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import {
  authorizationRequestUrl,
  metadataEndpoint,
  serverMetadata
} from '../../../lib/indieauth/index.js'
import type { AuthStartGetRequestQuerystring } from './schemas.js'

export interface Config {
  /**
   * Authorization endpoint URL. If not provided, the one found in the OAuth
   * Client ID Metadata Document will be used.
   */
  authorization_endpoint?: string
  code_verifier_length: number

  /**
   * Issuer identifier. If not provided, the one found in the OAuth Client ID
   * Metadata Document will be used.
   */
  issuer?: string
  log_prefix: string
  redirect_uri: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthStartGetRequestQuerystring
}

/**
 * Starts the IndieAuth flow.
 *
 * 1. The client canonicalizes the 'me' URL.
 * 2. The client fetches the 'me' URL to discover rel=indieauth-metadata.
 * 3. The client fetches the 'indieauth-metadata' URL to find
 *    authorization_endpoint, token_endpoint and other information.
 * 4. The client builds the authorization request and redirects to redirects to
 *    the authorization endpoint
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 */
export const defAuthStartGet = (config: Config) => {
  const { code_verifier_length, log_prefix, redirect_uri } = config

  const authStartGet: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { client_id, me } = request.query

    // TODO: Every `me` has its own `client_id`. I think I need to store the
    // expected `me` and `client_id` in persistent storage (e.g. a database or a
    // file). Since `me` and `client_id` are not sensitive information, I can
    // store them in plain text in a file.
    // See how IndieLogin and other website do it.

    request.log.debug(`${log_prefix}perform IndieAuth Discovery on ${me}`)
    const { error: metadata_endpoint_error, value: metadata_endpoint } =
      await metadataEndpoint(me)

    if (metadata_endpoint_error) {
      const error_description = `Found no IndieAuth metadata endpoint for for profile URL ${me}.`
      const original = metadata_endpoint_error.message
      request.log.warn(`${log_prefix}${error_description} ${original}`)
      // Should I return HTTP 400? See IndieAuth Discovery spec (and OAuth 2.0
      // Discovery).
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(
      `${log_prefix}site ${me} hosts its authorization server metadata at ${metadata_endpoint}. Fetching it now...`
    )
    const { error: server_metadata_error, value: server_metadata } =
      await serverMetadata(metadata_endpoint)

    if (server_metadata_error) {
      const error_description = `No authorization server metadata for site ${me}.`
      const original = server_metadata_error.message
      request.log.warn(`${log_prefix}${error_description} ${original}`)
      // Should I return HTTP 400? See IndieAuth Discovery spec (and OAuth 2.0
      // Discovery).
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(`${log_prefix}retrieved authorization server metadata`)

    const {
      authorization_response_iss_parameter_supported,
      code_challenge_methods_supported,
      introspection_endpoint,
      scopes_supported,
      revocation_endpoint,
      token_endpoint,
      userinfo_endpoint
    } = server_metadata

    // const prefix = `${log_prefix}OAuth Client ID Metadata Document published at ${metadata_endpoint}`
    const prefix = `${log_prefix}server metadata`

    if (introspection_endpoint) {
      request.session.set('introspection_endpoint', introspection_endpoint)
      request.log.debug(
        `${prefix}includes 'introspection_endpoint'. Set it in session.`
      )
    }

    if (revocation_endpoint) {
      request.session.set('revocation_endpoint', revocation_endpoint)
      request.log.debug(
        `${prefix}includes 'introspection_endpoint'. Set it in session.`
      )
    }

    if (token_endpoint) {
      request.session.set('token_endpoint', token_endpoint)
      request.log.debug(
        `${prefix}includes 'introspection_endpoint'. Set it in session.`
      )
    }

    if (userinfo_endpoint) {
      request.session.set('userinfo_endpoint', userinfo_endpoint)
      request.log.debug(
        `${prefix}includes 'introspection_endpoint'. Set it in session.`
      )
    }

    const authorization_endpoint =
      config.authorization_endpoint || server_metadata.authorization_endpoint

    const issuer = config.issuer || server_metadata.issuer

    // All IndieAuth clients MUST use PKCE
    // https://indieauth.spec.indieweb.org/#authorization-request
    if (!code_challenge_methods_supported) {
      const error_description = `The OAuth Client ID Metadata Document published at ${metadata_endpoint} does not include 'code_challenge_methods_supported'. This is a problem, since all IndieAuth clients MUST use PKCE.`
      throw new InvalidRequestError({ error_description })
    }

    // The "code_challenge_method" value must be set either to "S256" or a value
    // defined by a cryptographically secure "code_challenge_method" extension.
    // https://www.rfc-editor.org/rfc/rfc7636.html
    const expected_code_challenge_method = 'S256'
    // I am not sure what to do if the OAuth Client ID Metadata Document
    // publishes "code_challenge_method" values other than "S256". I guess this
    // client and the authorization endpoint must agree on which method to use.
    const code_challenge_method = code_challenge_methods_supported.find(
      (s) => s === expected_code_challenge_method
    )

    if (!code_challenge_method) {
      const error_description = `The OAuth Client ID Metadata Document published at ${metadata_endpoint} does not include '${expected_code_challenge_method}' in 'code_challenge_methods_supported'. This is a problem, since all IndieAuth clients MUST use PKCE and the authorization endpoint expects clients to use '${expected_code_challenge_method}' for the code challenge.`
      throw new InvalidRequestError({ error_description })
    }

    if (!scopes_supported) {
      const warning = `OAuth Client ID Metadata Document published at ${metadata_endpoint} does not include 'scopes_supported'.`
      request.log.warn(`${log_prefix}${warning}`)
    }

    const state = reply.generateCsrf()
    request.session.set('state', state)
    request.log.debug(
      `${log_prefix}generated state (CSRF token) and set it in session`
    )

    const auth = authorizationRequestUrl({
      authorization_endpoint,
      client_id,
      code_challenge_method,
      code_verifier_length,
      me,
      redirect_uri,
      scopes: scopes_supported,
      state
    })
    request.log.debug(`${log_prefix}generated URL for authorization endpoint`)

    assert.strictEqual(
      auth.state,
      state,
      `The state (CSRF token) returned by authorization URL does not match the generated state`
    )

    assert.strictEqual(
      auth.code_verifier.length,
      code_verifier_length,
      `The code verifier length returned by authorization URL is ${auth.code_verifier.length}, when it should be ${code_verifier_length}`
    )

    request.session.set('code_verifier', auth.code_verifier)
    request.log.debug(
      `${log_prefix}generated code verifier (for PKCE code challenge) and set it in session`
    )

    // Since the authorization endpoint supports the "iss" parameter (optional
    // in OAuth 2.0 servers, but required in IndieAuth servers), the client MUST
    // verify that the "iss" value received in the redirect URI matches the
    // "issuer" value found in the OAuth Client ID Metadata Document.
    // https://indieauth.spec.indieweb.org/#authorization-response
    if (authorization_response_iss_parameter_supported && issuer) {
      request.session.set('issuer', issuer)
      request.log.debug(`${log_prefix}set expected issuer in session`)
    }

    return reply.redirect(auth.redirect_url)
  }

  return authStartGet
}
