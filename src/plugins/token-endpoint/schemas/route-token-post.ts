import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { ajv, include_error_description } from '../../../lib/schemas/index.js'
import {
  client_id,
  issuer,
  me_after_url_canonicalization,
  profile,
  userinfo_endpoint
} from '../../../lib/indieauth/index.js'
import {
  expiration,
  onIssuedTokens,
  type OnIssuedTokens
} from '../../../lib/issue-tokens/index.js'
import { jwks_private } from '../../../lib/jwks/index.js'
import {
  access_token,
  authorization_code,
  authorization_endpoint,
  expires_in,
  redirect_uri,
  refresh_token,
  revocation_endpoint,
  scope
} from '../../../lib/oauth2/index.js'
import { code_verifier } from '../../../lib/pkce/index.js'
import {
  retrieveRefreshToken,
  type RetrieveRefreshToken
} from '../../../lib/storage-api/index.js'
import { DEFAULT } from '../constants.js'

export const config = Type.Object(
  {
    accessTokenExpiration: expiration,

    ajv,

    authorizationEndpoint: authorization_endpoint,

    includeErrorDescription: include_error_description,

    issuer,

    jwks: jwks_private,

    log_prefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    onIssuedTokens,

    refreshTokenExpiration: expiration,

    retrieveRefreshToken,

    revocationEndpoint: revocation_endpoint,

    userinfoEndpoint: userinfo_endpoint
  },
  { additionalProperties: false, $id: 'token-endpoint-post-method-config' }
)

export interface Config extends Static<typeof config> {
  ajv: Ajv
  onIssuedTokens: OnIssuedTokens
  retrieveRefreshToken: RetrieveRefreshToken
}

/**
 * Access Token Request body.
 *
 * @see [Access Token Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3)
 * @see [Redeeming the Authorization Code - IndieAuth](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 */
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
