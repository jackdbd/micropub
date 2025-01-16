import { Static, Type } from '@sinclair/typebox'
import {
  issuer,
  me_after_url_canonicalization
} from '../../../lib/indieauth/index.js'
import { jwks_url } from '../../../lib/jwks/index.js'
import { include_error_description } from '../../../lib/schemas/index.js'
import {
  retrieveRefreshToken,
  retrieveAccessToken,
  revokeAccessToken,
  revokeRefreshToken
} from '../../../lib/storage-api/index.js'
import type {
  RetrieveAccessToken,
  RetrieveRefreshToken,
  RevokeAccessToken,
  RevokeRefreshToken
} from '../../../lib/storage-api/index.js'
import { DEFAULT } from '../constants.js'

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

export const config = Type.Object(
  {
    ajv: Type.Any(),
    include_error_description,
    issuer,
    jwks_url,
    log_prefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),
    max_access_token_age: Type.String({ minLength: 1 }),
    me: me_after_url_canonicalization,
    retrieveAccessToken,
    retrieveRefreshToken,
    revokeAccessToken,
    revokeRefreshToken
  },
  { additionalProperties: false, $id: 'revocation-endpoint-post-method-config' }
)

export interface Config extends Static<typeof config> {
  retrieveAccessToken: RetrieveAccessToken
  retrieveRefreshToken: RetrieveRefreshToken
  revokeAccessToken: RevokeAccessToken
  revokeRefreshToken: RevokeRefreshToken
}
