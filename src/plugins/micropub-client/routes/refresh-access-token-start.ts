import assert from 'node:assert'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { AccessTokenResponseBodySuccess } from '@jackdbd/fastify-token-endpoint'
import { authorizationRequestUrl } from '@jackdbd/indieauth'
import {
  InvalidRequestError,
  InvalidTokenError
} from '@jackdbd/oauth2-error-responses'
import { errorResponseFromJSONResponse, safeDecode } from '@jackdbd/indieauth'
import type { AccessTokenClaims } from '@jackdbd/indieauth'

export interface Config {
  code_verifier_length: number
  include_error_description: boolean
  log_prefix: string
  redirect_path_on_error: string
  redirect_path_on_success: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: {
    authorization_endpoint: string
    client_id: string
    grant_type: 'refresh_token'
    me: string
    redirect_uri: string
    refresh_token: string
    revocation_endpoint: string
    scope: string
    token_endpoint: string
  }
}

export const defRefreshAccessTokenStart = (config: Config) => {
  const {
    code_verifier_length,
    include_error_description,
    log_prefix,
    redirect_path_on_error,
    redirect_path_on_success
  } = config
  const refreshAccessTokenStart: RouteHandler<RouteGeneric> = async (
    request,
    reply
  ) => {
    request.log.debug(
      { body: request.body, query: request.query },
      `${log_prefix}refresh access token start`
    )

    const {
      authorization_endpoint,
      client_id,
      me,
      redirect_uri,
      refresh_token,
      // revocation_endpoint,
      scope,
      token_endpoint
    } = request.query

    // TODO: if not found in session, do IndieAuth metadata discovery on 'me'
    // See auth-indieauth-start.ts
    const code_challenge_methods_supported = request.session.get(
      'code_challenge_methods_supported'
    )
    if (!code_challenge_methods_supported) {
      request.log.debug(
        `${log_prefix}code_challenge_methods_supported not found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
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
      const error_description = `code_challenge_method ${expected_code_challenge_method} is not supported by client ${client_id}.`
      throw new InvalidRequestError({ error_description })
    }

    const access_token = request.session.get('access_token')
    if (!access_token) {
      request.log.warn(
        `${log_prefix}no access token found in session; redirecting to ${redirect_path_on_error}`
      )
      return reply.redirect(redirect_path_on_error)
    }

    const state = reply.generateCsrf()
    request.session.set('state', state)
    request.log.debug(
      `${log_prefix}generated state (CSRF token) and set it in session`
    )

    const scopes = scope.split(' ')

    const auth = authorizationRequestUrl({
      authorization_endpoint,
      client_id,
      code_challenge_method,
      code_verifier_length,
      me,
      redirect_uri,
      scopes,
      state
    })

    assert.strictEqual(
      auth.state,
      state,
      `The state (CSRF token) returned by authorization request URL does not match the one generated by client ${client_id}`
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

    // TODO: does this request require an access token? Or just being
    // authenticated is enough? Read specs.
    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code_verifier: auth.code_verifier,
        grant_type: 'refresh_token',
        me,
        refresh_token,
        redirect_uri,
        scope,
        state
      })
    })

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    const res_body: AccessTokenResponseBodySuccess = await response.json()

    request.session.set('access_token', res_body.access_token)
    request.log.debug(`${log_prefix}set access token in session`)

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      const error_description = `Error while decoding access token: ${decode_error.message}`
      // Which one is more appropriate? UnauthorizedError or InvalidTokenError?
      // throw new UnauthorizedError({ error_description })
      const err = new InvalidTokenError({ error_description })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    request.session.set('claims', claims)
    request.log.debug(`${log_prefix}set access token decoded claims in session`)

    if (res_body.refresh_token) {
      request.session.set('refresh_token', res_body.refresh_token)
      request.log.debug(`${log_prefix}set refresh token in session`)
    }

    // return reply.send(res_body)

    request.log.debug(`${log_prefix}redirect to ${redirect_path_on_success}`)
    return reply.redirect(redirect_path_on_success)
  }

  return refreshAccessTokenStart
}
