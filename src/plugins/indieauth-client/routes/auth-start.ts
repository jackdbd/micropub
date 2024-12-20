import assert from 'node:assert'
import type { RouteHandler } from 'fastify'
import {
  authorizationUrl,
  canonicalUrl,
  metadataEndpoint,
  serverMetadata
} from '../../../lib/indieauth/index.js'
import { invalidRequest } from '../../../lib/micropub/error-responses.js'
import type { AuthStartGetRequestQuerystring } from './schemas.js'

export interface Config {
  code_verifier_length: number
  include_error_description: boolean
  log_prefix: string
  redirect_uri: string
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
  const {
    code_verifier_length,
    include_error_description,
    log_prefix,
    redirect_uri
  } = config

  const authStartGet: RouteHandler<{
    Querystring: AuthStartGetRequestQuerystring
  }> = async (request, reply) => {
    const { client_id } = request.query

    const me = canonicalUrl(request.query.me)

    request.log.debug(`${log_prefix}perform IndieAuth Discovery on ${me}`)
    const { error: metadata_endpoint_error, value: metadata_endpoint } =
      await metadataEndpoint(me)

    if (metadata_endpoint_error) {
      const error_description = `Found no IndieAuth metadata endpoint for site ${me}.`
      const original = metadata_endpoint_error.message
      request.log.warn(`${log_prefix}${error_description} ${original}`)

      // Should I return HTTP 400? See IndieAuth Discovery spec (and OAuth 2.0
      // Discovery).
      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(
      `${log_prefix}site ${me} hosts its IndieAuth server metadata at ${metadata_endpoint}. Fetching it now...`
    )
    const { error: server_metadata_error, value: server_metadata } =
      await serverMetadata(metadata_endpoint)

    if (server_metadata_error) {
      const error_description = `No IndieAuth server metadata for site ${me}.`
      const original = server_metadata_error.message
      request.log.warn(`${log_prefix}${error_description} ${original}`)

      // Should I return HTTP 400? See IndieAuth Discovery spec (and OAuth 2.0
      // Discovery).
      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}retrieved IndieAuth server metadata`)
    request.log.warn(server_metadata, `${log_prefix} IndieAuth server metadata`)

    const {
      authorization_endpoint,
      //   authorization_response_iss_parameter_supported,
      code_challenge_methods_supported,
      //   issuer,
      scopes_supported
    } = server_metadata

    // TODO: double check whether PKCE is mandatory or not.
    if (!code_challenge_methods_supported) {
      const error_description = `Authorization endpoint does not support code challenges (PKCE).`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const code_challenge_method = code_challenge_methods_supported[0]

    // const before = {
    //   code_verifier: request.session.get('code_verifier'),
    //   state: request.session.get('state')
    // }
    // request.log.warn(before, `${log_prefix}SESSION BEFORE`)

    request.log.debug(`${log_prefix}generate state (CSRF token)`)
    const state = reply.generateCsrf()
    request.session.set('state', state)
    request.log.warn(
      `${log_prefix}generated state (CSRF token) and set it in session`
    )

    const auth = authorizationUrl({
      authorization_endpoint,
      client_id,
      code_challenge_method,
      code_verifier_length,
      me,
      redirect_uri,
      scopes: scopes_supported!,
      state
    })
    request.log.debug(auth, `${log_prefix}generated authorization URL`)

    assert.strictEqual(
      auth.state,
      state,
      `The state (CSRF token) returned by authorization URL does not match the generated state`
    )

    request.session.set('code_verifier', auth.code_verifier)
    request.log.debug(
      `${log_prefix}generated code verifier and set it in session`
    )

    // const after = {
    //   code_verifier: request.session.get('code_verifier'),
    //   state: request.session.get('state')
    // }
    // request.log.warn(after, `${log_prefix}SESSION AFTER`)

    return reply.redirect(auth.url)
  }

  return authStartGet
}
