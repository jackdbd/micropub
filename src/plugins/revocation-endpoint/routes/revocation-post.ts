import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  secondsToUTCString,
  unixTimestampInSeconds
} from '../../../lib/date.js'
import {
  InvalidRequestError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import type { JWKSPublicURL } from '../../../lib/schemas/index.js'
import type {
  AccessTokenRecord,
  RefreshTokenRecord,
  RetrieveAccessToken,
  RetrieveRefreshToken,
  StoreAccessToken,
  StoreRefreshToken
} from '../../../lib/token-storage-interface/index.js'
import { type AccessTokenClaims, verify } from '../../../lib/token/index.js'

interface RequestBody {
  revocation_reason?: string
  token: string
  token_type_hint?: 'access_token' | 'refresh_token'
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

interface Config {
  include_error_description: boolean
  issuer: string
  jwks_url: JWKSPublicURL
  log_prefix: string
  max_access_token_age: string
  me: string
  retrieveAccessToken: RetrieveAccessToken
  retrieveRefreshToken: RetrieveRefreshToken
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}

interface AccessTokenConfig {
  issuer: string
  jwks_url: JWKSPublicURL
  max_token_age: string
  retrieveAccessToken: RetrieveAccessToken
  token: string
}

const accessTokenResult = async (config: AccessTokenConfig) => {
  const { issuer, jwks_url, max_token_age, retrieveAccessToken, token } = config
  // TODO: should I verify or decode the access token? Read specs.
  // This validates the signature of the token.
  const { error: verify_error, value: claims } =
    await verify<AccessTokenClaims>({
      issuer,
      jwks_url,
      jwt: token,
      max_token_age
    })

  if (verify_error) {
    return { error: verify_error }
  }

  // This does NOT validate the signature of the token.
  // const { error: error_decode, value: claims } = await safeDecode(token)

  // if (error_decode) {
  //   const message = `Nothing to revoke, since the token is invalid.`
  //   request.log.debug(`${log_prefix}${message} ${error_decode.message}`)
  //   return reply.code(200).send({ message })
  // }

  const { error: retrieve_error, value: access_token_record } =
    await retrieveAccessToken(claims.jti)

  if (retrieve_error) {
    return { error: retrieve_error }
  }

  return { value: { claims, record: access_token_record } }
}

/**
 * Revokes an access token or a refresh token.
 *
 * The token to be revoked is NOT NECESSARILY the same token found in the
 * Authorization header.
 *
 * The authorization server first validates the client credentials (in case of a
 * confidential client) and then verifies whether the token was issued to the
 * client making the revocation request. If this validation fails, the request
 * is refused and the client is informed of the error by the authorization server.
 *
 * The revocation endpoint responds with HTTP 200 for both the case where the
 * token was successfully revoked, or if the submitted token was invalid.
 *
 * Clients MAY pass the `token_type_hint` parameter in order to help the
 * authorization server to optimize the token lookup. If the server is unable to
 * locate the token using the given hint, it MUST extend its search across all
 * of its supported token types.
 *
 * @see [Token revocation - IndieAuth spec](https://indieauth.spec.indieweb.org/#token-revocation)
 * @see [Revocation Request - OAuth 2.0 Token Revocation (RFC 7009)](https://datatracker.ietf.org/doc/html/rfc7009#section-2.1)
 * @see [Revocation Response - OAuth 2.0 Token Revocation (RFC 7009)](https://www.rfc-editor.org/rfc/rfc7009.html#section-2.2)
 */
export const defRevocationPost = (config: Config) => {
  const {
    include_error_description,
    issuer,
    jwks_url,
    log_prefix,
    max_access_token_age: max_token_age,
    me,
    retrieveAccessToken,
    retrieveRefreshToken,
    storeAccessToken,
    storeRefreshToken
  } = config

  const revocationPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { revocation_reason, token, token_type_hint } = request.body

    // I THINK that a request body that has no token, or a request body that
    // includes an expired token, should return HTTP 200.
    if (!token) {
      const message = `Nothing to revoke, since request body includes no token.`
      request.log.debug(`${log_prefix}${message}`)
      return reply.code(200).send({ message })
    }

    const found: {
      access_token_value:
        | { record: AccessTokenRecord; claims: AccessTokenClaims }
        | undefined
      refresh_token_record: RefreshTokenRecord | undefined
    } = {
      access_token_value: undefined,
      refresh_token_record: undefined
    }

    if (token_type_hint === 'refresh_token') {
      request.log.debug(`${log_prefix}search among refresh tokens`)
      const { value: record } = await retrieveRefreshToken(token)

      if (record) {
        found.refresh_token_record = record
      } else {
        request.log.debug(`${log_prefix}search among access tokens`)

        const { value } = await accessTokenResult({
          issuer,
          jwks_url,
          token,
          max_token_age,
          retrieveAccessToken
        })

        if (value) {
          found.access_token_value = value
        }
      }
    } else {
      request.log.debug(`${log_prefix}search among access tokens`)

      const { value } = await accessTokenResult({
        issuer,
        jwks_url,
        token,
        max_token_age,
        retrieveAccessToken
      })

      if (value) {
        found.access_token_value = value
      } else {
        request.log.debug(`${log_prefix}search among refresh tokens`)
        const { value: record } = await retrieveRefreshToken(token)
        if (record) {
          found.refresh_token_record = record
        }
      }
    }

    if (found.access_token_value) {
      request.log.debug(`${log_prefix}token found among access tokens`)
      const { claims, record } = found.access_token_value

      if (!claims.me) {
        const message = 'Cannot revoke token because it has no `me` claim.'
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      // The authorization server verifies whether the token was issued to the
      // client making the revocation request.
      // https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
      // Should I also validate client_id? How should I do it? By calling the
      // authorization endpoint like how it's done in the token endpoint?
      if (claims.me !== me) {
        const error_description = `The access token has me=${claims.me}. This authorization server can only revoke access tokens issued with me=${me}`
        const err = new InvalidRequestError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (!claims.jti) {
        const message = 'Cannot revoke token because it has no `jti` claim.'
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      if (!claims.scope) {
        const message = 'Cannot revoke token because it has no `scope` claim.'
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      if (!claims.exp) {
        const message = 'Cannot revoke token because it has no `exp` claim.'
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      const unix_now = unixTimestampInSeconds()
      if (claims.exp < unix_now) {
        const exp = secondsToUTCString(claims.exp)
        const now = secondsToUTCString(unix_now)
        const message = `Nothing to revoke, since the access token expired at ${exp} (now is ${now}).`
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      const { error: revoke_error, value } = await storeAccessToken({
        ...record,
        jti: claims.jti,
        revoked: true,
        revocation_reason
      })

      // The revocation itself can fail, and if it's not the client's fault, it
      // does not make sense to return a 4xx. A generic server error is more
      // appropriate.
      if (revoke_error) {
        const original = revoke_error.message
        const error_description = `Cannot revoke token: ${original}`
        const err = new ServerError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (value && value.message) {
        request.log.debug(`${log_prefix}${value.message}`)
      }

      return reply
        .code(200)
        .send({ message: `Access token ${claims.jti} revoked` })
    } else if (found.refresh_token_record) {
      request.log.debug(`${log_prefix}token found among refresh tokens`)
      const record = found.refresh_token_record
      // The authorization server verifies whether the token was issued to the
      // client making the revocation request.
      // https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
      if (record.me !== me) {
        const error_description = `The refresh token has me=${record.me}. This authorization server can only revoke refresh tokens issued with me=${me}.`
        const err = new InvalidRequestError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      const unix_now = unixTimestampInSeconds()
      if (record.exp < unix_now) {
        const exp = secondsToUTCString(record.exp)
        const now = secondsToUTCString(unix_now)
        const message = `Nothing to revoke, since the refresh token expired at ${exp} (now is ${now}).`
        request.log.debug(`${log_prefix}${message}`)
        return reply.code(200).send({ message })
      }

      const { error: revoke_error, value } = await storeRefreshToken({
        ...record,
        refresh_token: token,
        revoked: true,
        revocation_reason
      })

      // The revocation itself can fail, and if it's not the client's fault, it
      // does not make sense to return a 4xx. A generic server error is more
      // appropriate.
      if (revoke_error) {
        const original = revoke_error.message
        const error_description = `Cannot revoke token: ${original}`
        const err = new ServerError({ error_description })
        return reply
          .code(err.statusCode)
          .send(err.payload({ include_error_description }))
      }

      if (value && value.message) {
        request.log.debug(`${log_prefix}${value.message}`)
      }

      return reply.code(200).send({ message: `Refresh token ${token} revoked` })
    } else {
      const message = `Nothing to revoke, since token ${token} cannot be found, neither among the access tokens, nor among the refresh tokens.`
      request.log.debug(`${log_prefix}${message}`)
      return reply.code(200).send({ message })
    }
  }

  return revocationPost
}
