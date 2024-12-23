import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import { errorMessageFromJSONResponse } from '../../../lib/oauth2/index.js'
import type {
  TokenPostConfig as Config,
  TokenPostRequestBody
} from './schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: TokenPostRequestBody
}

/**
 * Verifies the authorization code and issues an access token.
 *
 * @see [Access Token Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#access-token-response)
 */
export const defTokenPost = (config: Config) => {
  const { authorization_endpoint, issueJWT, log_prefix } = config

  // OAuth 2.0 Access Token Request
  // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3

  // The token endpoint needs to verify that:
  //
  // 1. the authorization code is valid (does it simply mean not expired?)
  // 2. the authorization code was issued for the matching client_id and
  //    redirect_uri (so it needs access to the storage where authorization
  //    codes are stored)
  // 3. the authorization code contains at least one scope (so it needs access
  //    to the storage where authorization codes are stored)
  // 4. the provided code_verifier hashes to the same value as given in the
  //    code_challenge in the original authorization request. But how is this
  //    possible? The IndieAuth client and the token endpoint could be on
  //    different servers! Do I need to store the code challenge where the
  //    authorization codes are stored?
  //
  // https://indieauth.spec.indieweb.org/#access-token-response
  // I think that all except the last one of these checks are done at the /auth
  // endpoint (POST /auth).

  const tokenPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { client_id, code, code_verifier, grant_type, redirect_uri } =
      request.body

    if (grant_type !== 'authorization_code') {
      const error_description = `This token endpoint only supports the 'authorization_code' grant type.`
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(
      `${log_prefix}POST to ${authorization_endpoint} to verify authorization code`
    )

    request.log.warn(
      `${log_prefix}TODO: verify that 'code_verifier' hashes to the same value as given in the code_challenge in the original authorization request`
    )

    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    const response = await fetch(authorization_endpoint, {
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

    if (!response.ok) {
      const msg = await errorMessageFromJSONResponse(response)
      const error_description = `Cannot verify authorization code: ${msg}`
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(
      `${log_prefix}the authorization endpoint ${authorization_endpoint} verified the authorization code`
    )

    // After the authorization server verifies that the redirect_uri, client_id
    // match the code given, the response will include the "me" and "scope"
    // values.
    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    let auth_res_body: { me: string; scope: string }
    try {
      auth_res_body = await response.json()
    } catch (err: any) {
      const error_description = `Cannot parse the JSON response received from the authorization endpoint: ${err.message}.`
      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      throw new ServerError({ error_description })
    }

    const { me, scope } = auth_res_body
    request.log.warn(
      auth_res_body,
      `${log_prefix} === response body from authorization endpoint ${authorization_endpoint} ===`
    )

    if (!me) {
      const error_description = `Response body from authorization endpoint does not include 'me'.`
      throw new ServerError({ error_description })
    }

    // If the authorization code was issued with no scope, the token endpoint
    // MUST NOT issue an access token.
    // https://indieauth.spec.indieweb.org/#access-token-response

    // if (!scope) {
    //   const error_description = `Response body from authorization endpoint does not include 'scope'`
    //   request.log.error(`${log_prefix}${error_description}`)
    //   throw new ServerError({ error_description })
    // }

    const payload = { me, scope }
    const { error, value } = await issueJWT(payload)

    if (error) {
      const error_description = `Cannot issue JWT: ${error.message}`
      throw new ServerError({ error_description })
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
