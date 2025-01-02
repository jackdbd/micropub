import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer, me, profile } from '../../../lib/indieauth/index.js'
import { exp, iat, iss, jti, jwt } from '../../../lib/jwt/index.js'
import {
  authorization_endpoint,
  expires_in,
  refresh_token,
  scope
} from '../../../lib/oauth2/index.js'
import {
  include_error_description,
  jwks_private,
  report_all_ajv_errors
} from '../../../lib/schemas/index.js'
import {
  storeAccessToken,
  type StoreAccessToken
} from '../../../lib/token-storage-interface/index.js'
import { DEFAULT } from '../constants.js'

export const token_post_config = Type.Object({
  access_token_expiration: Type.String({ minLength: 1 }),
  ajv: Type.Optional(Type.Any()),
  authorization_endpoint,
  include_error_description,
  issuer,
  jwks: jwks_private,
  log_prefix: Type.String(),
  report_all_ajv_errors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),
  storeAccessToken
})

export interface TokenPostConfig extends Static<typeof token_post_config> {
  ajv?: Ajv
  storeAccessToken: StoreAccessToken
}

/**
 * Access Token response.
 *
 * @see [Access Token Response - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-response)
 * @see [Access Token Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4)
 */
export const access_token_response_body_success = Type.Object({
  access_token: jwt,
  expires_in: Type.Optional(expires_in),
  me,
  payload: Type.Object({ exp, iat, iss, jti }),
  profile: Type.Optional(profile),
  refresh_token,
  scope,
  token_type: Type.Literal('Bearer')
})

export type AccessTokenResponseBodySuccess = Static<
  typeof access_token_response_body_success
>
