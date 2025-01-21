import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type { Profile } from '@jackdbd/indieauth'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import {
  InvalidRequestError,
  InvalidGrantError,
  UnauthorizedError,
  UnsupportedGrantTypeError,
  ServerError
} from '@jackdbd/oauth2-error-responses'
import { accessTokenFromRequestHeader } from '../../../lib/fastify-utils/index.js'
import { issuedInfo, type IssuedInfo } from '../../../lib/issue-tokens/index.js'
import { retrieveProfile } from '../../../lib/retrieve-profile.js'
import { revokeToken } from '../../../lib/revoke-token.js'
import type {
  RefreshTokenImmutableRecord,
  RefreshTokenMutableRecord
} from '../../../lib/storage-api/index.js'
import { verifyAuthorizationCode } from '../../../lib/verify-authorization-code.js'
import { token_post_config } from '../schemas/index.js'
import type {
  AccessTokenRequestBody,
  RefreshRequestBody,
  TokenPostConfig
} from '../schemas/index.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: AccessTokenRequestBody | RefreshRequestBody
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
export const defTokenPost = (config: TokenPostConfig) => {
  const {
    accessTokenExpiration: access_token_expiration,
    ajv,
    authorizationEndpoint: authorization_endpoint,
    includeErrorDescription: include_error_description,
    issuer,
    jwks,
    log_prefix: prefix,
    onIssuedTokens,
    refreshTokenExpiration: refresh_token_expiration,
    retrieveRefreshToken,
    revocationEndpoint: revocation_endpoint,
    userinfoEndpoint: userinfo_endpoint
  } = config

  throwWhenNotConform(
    { ajv, schema: token_post_config, data: config },
    { basePath: 'token-endpoint-post-method-config' }
  )

  const tokenPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { grant_type } = request.body

    let issued_info: IssuedInfo
    if (grant_type === 'refresh_token') {
      const { refresh_token, scope } = request.body

      let record: RefreshTokenImmutableRecord | RefreshTokenMutableRecord
      try {
        record = await retrieveRefreshToken(refresh_token)
      } catch (ex: any) {
        let error_description = `The user-provided retrieveRefreshToken function threw an exception.`
        if (ex && ex.message) {
          error_description = `${error_description} Here is the original error message: ${ex.message}`
        }
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new ServerError({ error_description, error_uri })
        // const err = new InvalidGrantError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (record.revoked) {
        const details = record.revocation_reason
          ? ` (revocation_reason: ${record.revocation_reason as string})`
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
        const error_description = `Mismatch of parameter 'scope'. Request asks for these scopes: ${scope}. Refresh token found in storage has these scopes: ${
          record.scope as string
        }.`
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

      // check that issuer === record.iss?

      const { error, value } = await issuedInfo({
        access_token_expiration,
        ajv,
        client_id: record.client_id,
        issuer, // or record.iss
        // jti: record.jti,
        jwks,
        log: request.log,
        me: record.me,
        redirect_uri: record.redirect_uri,
        refresh_token_expiration,
        scope
      })

      if (error) {
        const error_description = error.message
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new ServerError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      issued_info = value

      try {
        await onIssuedTokens(issued_info)
      } catch (ex: any) {
        let error_description = `The user-provided onIssuedTokens function threw an exception.`
        if (ex && ex.message) {
          error_description = `${error_description} Here is the original error message: ${ex.message}`
        }
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new ServerError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }
      // === END of grant_type === 'refresh_token' ========================== //
    } else if (grant_type === 'authorization_code') {
      const { client_id, code, code_verifier, redirect_uri } = request.body

      // Do I need to do this in the token endpoint or in the authorization
      // endpoint?
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

      request.log.debug(
        `${prefix}issuer ${issuer} will now try issuing an access token and a refresh token that can be used by client_id ${client_id} to access resources owned by ${me}`
      )

      const { error, value } = await issuedInfo({
        access_token_expiration,
        ajv,
        client_id,
        issuer, // or record.iss
        // jti: record.jti,
        jwks,
        log: request.log,
        me,
        redirect_uri,
        refresh_token_expiration,
        scope
      })

      if (error) {
        const error_description = error.message
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new ServerError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      issued_info = value

      try {
        await onIssuedTokens(issued_info)
      } catch (ex: any) {
        let error_description = `The user-provided onIssuedTokens function threw an exception.`
        if (ex && ex.message) {
          error_description = `${error_description} Here is the original error message: ${ex.message}`
        }
        request.log.error(`${prefix}${error_description}`)
        const error_uri = undefined
        const err = new ServerError({ error_description, error_uri })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }
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

    const {
      access_token,
      access_token_expires_in: expires_in,
      me,
      refresh_token,
      scope
    } = issued_info

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
    // https://indieauth.spec.indieweb.org/#access-token-response
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
