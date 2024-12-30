import { Static, Type } from '@sinclair/typebox'
import { me, profile } from '../../../lib/indieauth/index.js'
import { exp, iat, iss, jti, jwt } from '../../../lib/jwt/index.js'
import {
  authorization_endpoint,
  expires_in,
  refresh_token,
  scope
} from '../../../lib/oauth2/index.js'
import { include_error_description } from '../../../lib/schemas/index.js'
import {
  issueAccessToken,
  type IssueAccessToken
} from '../../../lib/token-storage-interface/index.js'

export const token_post_config = Type.Object({
  authorization_endpoint,
  include_error_description,
  issueAccessToken,
  log_prefix: Type.String()
})

export interface TokenPostConfig extends Static<typeof token_post_config> {
  issueAccessToken: IssueAccessToken
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
