import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type { Profile } from '../../../lib/indieauth/index.js'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import {
  InvalidRequestError,
  InvalidGrantError,
  UnauthorizedError,
  UnsupportedGrantTypeError
} from '../../../lib/fastify-errors/index.js'
import { accessTokenFromRequestHeader } from '../../../lib/fastify-utils/index.js'
import { issueToken, type IssueTokenValue } from '../../../lib/issue-token.js'
import { retrieveProfile } from '../../../lib/retrieve-profile.js'
import { revokeToken } from '../../../lib/revoke-token.js'
import { throwIfDoesNotConform } from '../../../lib/validators.js'
import { verifyAuthorizationCode } from '../../../lib/verify-authorization-code.js'
import { DEFAULT } from '../constants.js'
import {
  type AccessTokenRequestBody,
  type RefreshRequestBody,
  token_post_options,
  type TokenPostOptions
} from '../schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: AccessTokenRequestBody | RefreshRequestBody
}

// TODO: decide whether to issue a refresh token only if `offline_access` is
// included in `scope`.
// The offline_access scope is specified only in OpenID Connect. It's not
// mentioned in OAuth 2.0 or IndieAuth.
// https://github.com/manfredsteyer/angular-oauth2-oidc/issues/1241
// https://github.com/GluuFederation/oxAuth/issues/1172
// https://openid.net/specs/openid-connect-basic-1_0.html#OfflineAccessPrivacy

const defaults: Partial<TokenPostOptions> = {
  accessTokenExpiration: DEFAULT.ACCESS_TOKEN_EXPIRATION,
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  refreshTokenExpiration: DEFAULT.REFRESH_TOKEN_EXPIRATION,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

/**
 * Returns a route handler that issues access tokens and refresh tokens.
 *
 * In order to be able to [revoke](https://datatracker.ietf.org/doc/html/rfc7009)
 * tokens or [introspect](https://www.rfc-editor.org/rfc/rfc7662) tokens, an
 * authorization server must keep track of the tokens it issued. This endpoint
 * does this by assigning a unique identifier to each token it issues, and by
 * storing this identifier—along with some other piece of information—in some
 * persistent storage (e.g. a database, a service that provides object storage).
 *
 * ### [Access Token Request](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3)
 *
 * The token endpoint needs to verify that:
 *
 * 1. the authorization code is valid
 * 2. the authorization code was issued for the matching `client_id` and
 *    `redirect_uri`
 * 3. the authorization code contains **at least one scope**
 * 4. the provided `code_verifier` hashes to the same value as given in the
 *    `code_challenge` in the original authorization request.
 *
 * ### [Refreshing an Access Token](https://datatracker.ietf.org/doc/html/rfc6749#section-6)
 *
 * OAuth 2.1 **requires** either:
 *
 * - one-use only refresh tokens, or
 * - sender-constrained refresh tokens.
 *
 * Because refresh tokens are typically long-lasting credentials used to request
 * additional access tokens, the refresh token is bound to the client to which
 * it was issued.
 *
 * If the client type is confidential or the client was issued client
 * credentials (or assigned other authentication requirements), the client MUST
 * authenticate with the authorization server.
 */
export const defTokenPost = (options: TokenPostOptions) => {
  const config = applyToDefaults(
    defaults,
    options
  ) as Required<TokenPostOptions>

  const {
    accessTokenExpiration: access_token_expiration,
    authorizationEndpoint: authorization_endpoint,
    includeErrorDescription: include_error_description,
    issuer,
    jwks,
    logPrefix: prefix,
    refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors: report_all_ajv_errors,
    retrieveRefreshToken,
    revocationEndpoint: revocation_endpoint,
    storeAccessToken,
    storeRefreshToken,
    userinfoEndpoint: userinfo_endpoint
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

  throwIfDoesNotConform({ prefix }, ajv, token_post_options, config)

  const tokenPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { grant_type } = request.body

    let issue_token_value: IssueTokenValue
    if (grant_type === 'refresh_token') {
      const { refresh_token, scope } = request.body

      const { error, value: record } = await retrieveRefreshToken(refresh_token)

      if (error) {
        const original = error.message
        const error_description = `Cannot retrieve ${refresh_token} from storage: ${original}`
        request.log.warn(`${prefix}${error_description}`)
        // TODO: create an HTML page for "cannot retrieve refresh token from
        // storage", host it somewhere and the URL as error_uri parameter.
        const error_uri = undefined
        const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (record.revoked) {
        const details = record.revocation_reason
          ? ` (revocation_reason: ${record.revocation_reason})`
          : ''
        const error_description = `Refresh token ${refresh_token} is revoked${details}.`
        // TODO: create an HTML page for error_uri
        const error_uri = undefined
        const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      const now = unixTimestampInSeconds()

      if (record.exp < now) {
        const details = ` (expired_at: ${record.exp}, now: ${now})`
        const error_description = `Refresh token found in storage is expired${details}.`
        // TODO: create an HTML page for error_uri
        const error_uri = undefined
        const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (!record.me) {
        const error_description = `Refresh token found in storage has no 'me' parameter.`
        request.log.warn(`${prefix}${error_description}`)
        const err = new InvalidRequestError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (!record.scope) {
        const error_description = `Refresh token found in storage has no 'scope' parameter.`
        request.log.warn(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new InvalidRequestError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (scope !== record.scope) {
        const error_description = `Mismatch of parameter 'scope'. Request asks for these scopes: ${scope}. Refresh token found in storage has these scopes: ${record.scope}.`
        request.log.warn(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new InvalidRequestError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      const { value: access_token } = accessTokenFromRequestHeader(request)

      if (!access_token) {
        const error_description = `Cannot revoke refresh token ${refresh_token}: no access token in Authorization header.`
        const error_uri = undefined
        const err = new UnauthorizedError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      // Decide between these revocation reasons:
      // - `refreshed_access_token`
      // - `refreshed`
      // - `refresh_request`
      // https://datatracker.ietf.org/doc/html/rfc6749#section-6
      const revocation_reason = 'refreshed'

      request.log.debug(`${prefix}revoking refresh token ${refresh_token}`)

      const { error: revoke_error_refresh } = await revokeToken({
        access_token,
        revocation_endpoint,
        revocation_reason,
        token: refresh_token,
        token_type_hint: 'refresh_token'
      })

      if (revoke_error_refresh) {
        const payload = revoke_error_refresh.payload({
          include_error_description
        })
        request.log.error(
          `${prefix}cannot revoke refresh token ${refresh_token}: ${payload.error_description}`
        )
        return reply.code(revoke_error_refresh.statusCode).send(payload)
      }

      request.log.debug(
        `${prefix}revoked refresh token ${refresh_token} with revocation_reason: ${revocation_reason}`
      )

      // TODO: consider making it optional to revoke the current access token.
      // Access tokens are usually short-lived, so it might not be necessary to
      // revoke them.

      request.log.debug(`${prefix}revoking current access token`)

      const { error: revoke_error_access } = await revokeToken({
        access_token,
        revocation_endpoint,
        revocation_reason,
        token: access_token,
        token_type_hint: 'access_token'
      })

      if (revoke_error_access) {
        const payload = revoke_error_access.payload({
          include_error_description
        })
        request.log.error(
          `${prefix}cannot revoke access token: ${payload.error_description}`
        )
        return reply.code(revoke_error_access.statusCode).send(payload)
      }

      request.log.debug(
        `${prefix}revoked access token with revocation_reason: ${revocation_reason}`
      )

      const { error: issue_error, value } = await issueToken({
        access_token_expiration,
        client_id: record.client_id,
        issuer,
        jwks,
        // jti: record.jti,
        me: record.me,
        redirect_uri: record.redirect_uri,
        refresh_token_expiration,
        scope,
        storeAccessToken,
        storeRefreshToken
      })

      if (issue_error) {
        const payload = issue_error.payload({ include_error_description })
        request.log.error(
          `${prefix}cannot issue access token and refresh token: ${payload.error_description}`
        )
        return reply.code(issue_error.statusCode).send(payload)
      }

      issue_token_value = value
      request.log.debug(`${prefix}issued access token and refresh token`)
    } else if (grant_type === 'authorization_code') {
      const { client_id, code, code_verifier, redirect_uri } = request.body

      request.log.warn(
        `${prefix}TODO: verify that 'code_verifier' ${code_verifier} hashes to the same value as given in the code_challenge in the original authorization request`
      )

      const { error: verify_error, value: verify_value } =
        await verifyAuthorizationCode({
          authorization_endpoint,
          client_id,
          code,
          code_verifier,
          redirect_uri
        })

      if (verify_error) {
        const payload = verify_error.payload({ include_error_description })
        request.log.error(
          `${prefix}cannot verify authorization code ${code}: ${payload.error_description}`
        )
        return reply.code(verify_error.statusCode).send(payload)
      }

      request.log.debug(`${prefix}verified authorization code ${code}`)

      const { me, scope } = verify_value

      // IndieAuth requires a 'me' parameter in the access token response.
      // https://indieauth.spec.indieweb.org/#access-token-response-li-2
      if (!me) {
        const error_description = `Authorization code ${code} is verified but it has no 'me' parameter.`
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

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
      if (!scope) {
        const error_description = `Authorization code ${code} is verified but it has no 'scope' parameter.`
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      const { error: issue_error, value } = await issueToken({
        access_token_expiration,
        client_id,
        issuer,
        jwks,
        me,
        redirect_uri,
        refresh_token_expiration,
        scope,
        storeAccessToken,
        storeRefreshToken
      })

      if (issue_error) {
        const payload = issue_error.payload({ include_error_description })
        request.log.error(
          `${prefix}cannot issue access token and refresh token: ${payload.error_description}`
        )
        return reply.code(issue_error.statusCode).send(payload)
      }

      issue_token_value = value
      request.log.debug(`${prefix}issued access token and refresh token`)
    } else {
      const error_description = `This endpoint does not support grant type ${grant_type}.`
      const error_uri = undefined
      const err = new UnsupportedGrantTypeError({
        error_description,
        error_uri
      })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { access_token, expires_in, me, refresh_token, scope } =
      issue_token_value

    const scopes = scope.split(' ')

    let profile: Profile | undefined = undefined
    if (scopes.includes('profile')) {
      request.log.debug(
        `${prefix}access token has 'profile' scope, retrieving profile info from userinfo endpoint ${userinfo_endpoint}`
      )
      const { error: profile_error, value } = await retrieveProfile({
        access_token,
        userinfo_endpoint
      })

      if (profile_error) {
        const payload = profile_error.payload({
          include_error_description
        })
        request.log.error(
          `${prefix}cannot retrieve profile info: ${payload.error_description}`
        )
        return reply.code(profile_error.statusCode).send(payload)
      }

      profile = value
    }

    // The authorization server MUST include the HTTP "Cache-Control" response
    // header field with a value of "no-store" in any response containing tokens,
    // credentials, or other sensitive information, as well as the "Pragma"
    // response header field with a value of "no-cache".
    // https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
    return reply
      .code(200)
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .send({
        access_token,
        expires_in,
        me,
        profile,
        refresh_token,
        scope,
        token_type: 'Bearer'
      })
  }

  return tokenPost
}
