import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  issuer,
  me_before_url_canonicalization,
  me_after_url_canonicalization
} from '../../lib/indieauth/index.js'
import {
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  jwks_url,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  retrieveAccessToken,
  retrieveRefreshToken,
  type RetrieveAccessToken,
  type RetrieveRefreshToken,
  storeAccessToken,
  storeRefreshToken,
  type StoreAccessToken,
  type StoreRefreshToken
} from '../../lib/token-storage-interface/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  isAccessTokenBlacklisted,

  includeErrorDescription: Type.Optional(
    Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
  ),

  issuer,

  jwksUrl: jwks_url,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  maxAccessTokenAge: Type.Optional(Type.String({ minLength: 1 })),

  me: Type.Union([
    me_before_url_canonicalization,
    me_after_url_canonicalization
  ]),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  retrieveAccessToken,

  retrieveRefreshToken,

  storeAccessToken,

  storeRefreshToken
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  retrieveAccessToken: RetrieveAccessToken
  retrieveRefreshToken: RetrieveRefreshToken
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}

export const token_type_hint = Type.Union([
  Type.Literal('access_token'),
  Type.Literal('refresh_token')
])

/**
 * Revocation request.
 *
 * @see [Revocation Request - OAuth 2.0 Token Revocation (RFC 7009)](https://www.rfc-editor.org/rfc/rfc7009#section-2.1)
 */
export const revocation_request_body = Type.Object({
  /**
   * The token to revoke. It may be an access token or a refresh token. It may
   * different from the access token used to authorize the request.
   */
  token: Type.String({ minLength: 1 }),
  token_type_hint: Type.Optional(token_type_hint)
})

export type RevocationRequestBody = Static<typeof revocation_request_body>

export const revocation_response_body_success = Type.Object({
  message: Type.Optional(Type.String({ minLength: 1 }))
})

export type RevocationResponseBodySuccess = Static<
  typeof revocation_response_body_success
>
