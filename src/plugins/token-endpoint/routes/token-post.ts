import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import {
  AccessTokenClaims,
  randomKid,
  safeDecode,
  sign
} from '../../../lib/token/index.js'
import { errorMessageFromJSONResponse } from '../../../lib/oauth2/index.js'
import { throwIfDoesNotConform } from '../../../lib/validators.js'
import { type AccessTokenRequestBody } from '../../authorization-endpoint/index.js'
import { token_post_config, type TokenPostConfig } from './schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: AccessTokenRequestBody
}

/**
 * Verifies the authorization code and issues an access token.
 *
 * To be able to revoke tokens, we must keep track of the tokens we issued. We
 * do this by assigning a unique identifier to each token we issue, and by
 * storing this identifier—along with some other piece of information—in some
 * persistent storage (e.g. a database, a service that provides object storage).
 *
 * @see [Access Token Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#access-token-response)
 */
export const defTokenPost = (config: TokenPostConfig) => {
  const {
    access_token_expiration,
    authorization_endpoint,
    include_error_description,
    issuer,
    jwks,
    log_prefix,
    report_all_ajv_errors,
    storeAccessToken
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, token_post_config, config)

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
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
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
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${log_prefix}the authorization endpoint ${authorization_endpoint} verified the authorization code`
    )

    // After the authorization server has verified that "redirect_uri" and
    // "client_id" match "code", the response will include "me" and "scope".
    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    let auth_res_body: { me: string; scope: string }
    try {
      auth_res_body = await response.json()
    } catch (ex: any) {
      const error_description = `Cannot parse the JSON response received from the authorization endpoint: ${ex.message}.`
      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { me, scope } = auth_res_body

    if (!me) {
      const error_description = `Response body from authorization endpoint does not include 'me'.`
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // If the authorization code was issued with no scope, the token endpoint
    // MUST NOT issue an access token.
    // https://indieauth.spec.indieweb.org/#access-token-response
    if (!scope) {
      const error_description = `Response body from authorization endpoint does not include 'scope'`
      request.log.error(`${log_prefix}${error_description}`)
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { error: kid_error, value: kid } = randomKid(jwks.keys)

    if (kid_error) {
      const error_description = kid_error.message
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { error: sign_error, value: access_token } = await sign({
      expiration: access_token_expiration,
      issuer,
      jwks,
      kid,
      payload: { me, scope }
    })

    if (sign_error) {
      const error_description = sign_error.message
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // We need to decode the token we have just issued because we need to store
    // a few of its claims in the issue table.
    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      const error_description = decode_error.message
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { error } = await storeAccessToken(claims)

    if (error) {
      const error_description = error.message
      const err = new ServerError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(`${log_prefix}issued access token`)

    const { exp } = claims
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestampInSeconds()
    }

    // https://indieauth.spec.indieweb.org/#profile-information

    return reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .send({
        access_token,
        expires_in,
        me,
        payload: claims,
        // profile: { email: '', name: '', photo: '', url: '' },
        refresh_token: nanoid(),
        scope,
        token_type: 'Bearer'
      })
  }

  return tokenPost
}
