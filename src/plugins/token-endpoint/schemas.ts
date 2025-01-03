import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  client_id,
  issuer,
  me_after_url_canonicalization,
  profile,
  userinfo_endpoint
} from '../../lib/indieauth/index.js'
import {
  access_token,
  authorization_code,
  authorization_endpoint,
  expires_in,
  redirect_uri,
  refresh_token,
  revocation_endpoint,
  scope
} from '../../lib/oauth2/index.js'
import { code_verifier } from '../../lib/pkce/index.js'
import {
  include_error_description,
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  jwks_private,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  retrieveRefreshToken,
  type RetrieveRefreshToken,
  storeAccessToken,
  type StoreAccessToken,
  storeRefreshToken,
  type StoreRefreshToken
} from '../../lib/token-storage-interface/index.js'
import { DEFAULT } from './constants.js'

export const access_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

export const refresh_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

export const token_post_options = Type.Object({
  accessTokenExpiration: Type.Optional({
    ...access_token_expiration,
    default: DEFAULT.ACCESS_TOKEN_EXPIRATION
  }),

  ajv: Type.Optional(Type.Any()),

  authorizationEndpoint: authorization_endpoint,

  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
  }),

  issuer,

  jwks: jwks_private,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  refreshTokenExpiration: Type.Optional({
    ...refresh_token_expiration,
    default: DEFAULT.REFRESH_TOKEN_EXPIRATION
  }),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  retrieveRefreshToken,

  revocationEndpoint: revocation_endpoint,

  storeAccessToken,

  storeRefreshToken,

  userinfoEndpoint: userinfo_endpoint
})

export interface TokenPostOptions extends Static<typeof token_post_options> {
  ajv?: Ajv
  retrieveRefreshToken: RetrieveRefreshToken
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}

export const access_token_request_body = Type.Object({
  client_id,
  code: authorization_code,
  code_verifier,
  grant_type: Type.Literal('authorization_code'),
  redirect_uri
})

/**
 * Access Token Request body.
 *
 * @see [Access Token Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3)
 * @see [Redeeming the Authorization Code - IndieAuth](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 */
export type AccessTokenRequestBody = Static<typeof access_token_request_body>

/**
 * Request body of a refresh request.
 *
 * The requested scope MUST NOT include any scope not originally granted by the
 * resource owner, and if omitted is treated as equal to the scope originally
 * granted by the resource owner.
 *
 * @see [Refreshing an Access Token - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-6)
 */
export const refresh_request_body = Type.Object({
  grant_type: Type.Literal('refresh_token'),
  refresh_token,
  scope: Type.Optional(scope)
})

export type RefreshRequestBody = Static<typeof refresh_request_body>

export const access_token_response_body_success = Type.Object({
  access_token,

  expires_in: Type.Optional({
    ...expires_in,
    description: 'The lifetime in seconds of the access token.'
  }),

  me: {
    ...me_after_url_canonicalization,
    description:
      'The canonical user profile URL for the user this access token corresponds to.'
  },

  profile: Type.Optional(profile),

  refresh_token: Type.Optional(refresh_token),

  scope,

  token_type: Type.Literal('Bearer')
})

/**
 * Response body to a successful Access Token Request.
 *
 * @see [Access Token Response - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-response)
 * @see [Access Token Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4)
 */
export type AccessTokenResponseBodySuccess = Static<
  typeof access_token_response_body_success
>

export const options = Type.Object(
  {
    /**
     * Human-readable expiration time for the access token. It will be shown in
     * the consent screen.
     *
     * @example '15 minutes'
     */
    accessTokenExpiration: Type.Optional({
      ...access_token_expiration,
      default: DEFAULT.ACCESS_TOKEN_EXPIRATION
    }),

    ajv: Type.Optional(Type.Any()),

    /**
     * Endpoint that will be called to verify an authorization code before
     * issuing a token.
     */
    authorizationEndpoint: authorization_endpoint,

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    /**
     * Predicate function that will be called to check whether a previously
     * issued token is blacklisted or not.
     */
    isAccessTokenBlacklisted,

    issuer,

    jwks: jwks_private,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    /**
     * Human-readable expiration time for the refresh token. It will be shown in
     * the consent screen.
     *
     * @example '30 days'
     */
    refreshTokenExpiration: Type.Optional({
      ...refresh_token_expiration,
      default: DEFAULT.REFRESH_TOKEN_EXPIRATION
    }),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    retrieveRefreshToken,

    revocationEndpoint: revocation_endpoint,

    /**
     * Persists an access token to some storage (e.g. a database).
     */
    storeAccessToken,

    /**
     * Persists a refresh token to some storage (e.g. a database).
     */
    storeRefreshToken,

    userinfoEndpoint: userinfo_endpoint
  },
  {
    $id: 'fastify-token-endpoint-options',
    description: 'Options for the Fastify token-endpoint plugin',
    title: 'Fastify plugin token-endpoint options'
  }
)

/**
 * Options for the Fastify token-endpoint plugin.
 */
export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  retrieveRefreshToken: RetrieveRefreshToken
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}
