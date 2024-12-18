import type { RouteHandler } from 'fastify'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import { invalidRequest, serverError } from '../../../lib/micropub/index.js'
import type {
  TokenPostConfig as Config,
  TokenPostRequestBody
} from './schemas.js'

/**
 * Verifies the authorization code and issues an access token.
 *
 * @see [Access Token Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#access-token-response)
 */
export const defTokenPost = (config: Config) => {
  const {
    authorization_endpoint,
    include_error_description,
    issueJWT,
    log_prefix
  } = config

  // OAuth 2.0 Access Token Request
  // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3

  // The token endpoint needs to verify that the authorization code is valid,
  // and that it was issued for the matching client_id and redirect_uri,
  // contains at least one scope, and checks that the provided code_verifier
  // hashes to the same value as given in the code_challenge in the original
  // authorization request.
  // https://indieauth.spec.indieweb.org/#access-token-response

  const tokenPost: RouteHandler<{ Body: TokenPostRequestBody }> = async (
    request,
    reply
  ) => {
    const { client_id, code, code_verifier, grant_type, redirect_uri } =
      request.body

    if (grant_type !== 'authorization_code') {
      const error_description = `This token endpoint only supports the 'authorization_code' grant type.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.warn(
      { code_verifier },
      `${log_prefix}TODO: check that the provided code_verifier hashes to the same value as given in the code_challenge in the original authorization request`
    )

    request.log.debug(
      `${log_prefix}POST to ${authorization_endpoint} to verify authorization code`
    )

    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    const auth_response = await fetch(authorization_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code,
        code_verifier,
        grant_type,
        redirect_uri
      })
    })

    if (!auth_response.ok) {
      const error_description = `Could not verify authorization code (${auth_response.status})`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(
      `${log_prefix}the authorization endpoint ${authorization_endpoint} verified the authorization code`
    )

    let auth_res_body: { me: string; scope: string }
    try {
      auth_res_body = await auth_response.json()
    } catch (err: any) {
      const error_description = `Failed to parse the JSON response received from the authorization endpoint: ${err.message}`
      request.log.error(`${log_prefix}${error_description}`)

      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      const { code, body } = serverError({
        error: 'response_body_parse_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { me, scope } = auth_res_body
    request.log.warn(
      auth_res_body,
      `${log_prefix} === response body from authorization endpoint ${authorization_endpoint} ===`
    )

    if (!me) {
      const error_description = `Response body from authorization endpoint does not include 'me'`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'auth_response_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // if (!scope) {
    //   const error_description = `Response body from authorization endpoint does not include 'scope'`
    //   request.log.error(`${log_prefix}${error_description}`)

    //   const { code, body } = serverError({
    //     error: 'auth_response_error',
    //     error_description,
    //     include_error_description
    //   })

    //   return reply.errorResponse(code, body)
    // }

    const payload = { me, scope }
    const { error, value } = await issueJWT(payload)

    if (error) {
      const error_description = `Cannot issue JWT: ${error.message}`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'issue_jwt_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { claims, jwt, message } = value

    if (message) {
      request.log.debug(`${log_prefix}${message}`)
    }

    const { exp } = claims
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestampInSeconds()
    }

    // OAuth 2.0 Access Token Response
    // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4

    return reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .send({
        access_token: jwt,
        expires_in,
        me,
        payload: claims,
        refresh_token: nanoid(),
        scope,
        token_type: 'Bearer'
      })
  }

  return tokenPost
}
