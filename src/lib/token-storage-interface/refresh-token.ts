import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '@jackdbd/indieauth'
import { exp, iss, jti } from '../jwt/index.js'
import { redirect_uri, refresh_token, scope } from '@jackdbd/oauth2'
import { revoked, revocation_reason } from './revocation.js'

export const refresh_token_props = Type.Object(
  {
    /**
     * Identifier of the application that requested the token.
     */
    client_id,
    /**
     * Expiration of the token (in seconds from UNIX epoch).
     */
    exp,
    /**
     * Identifier of the token endpoint of the authorization server that issued
     * the token. I think it makes sense to store this information, in case the
     * authorization server has multiple token endpoints.
     */
    iss,
    /**
     * Identifier of the access token this refresh token is associated with.
     * TODO: clarify if this jti always refers to the **first** access token
     * this refresh token was generated from, or if it refers to the most recent
     * **refreshed** access token. Re-read "automatic reuse detection" in this article:
     * https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Refresh-Token-Automatic-Reuse-Detection
     */
    jti,
    me: me_after_url_canonicalization,
    redirect_uri,
    refresh_token,
    revoked: Type.Optional(revoked),
    revocation_reason: Type.Optional(revocation_reason),
    scope
  },
  {
    $id: 'refresh-token-props',
    additionalProperties: false,
    description:
      'Properties of a refresh token (a storage implementation may have addition properties)',
    title: 'Refresh Token Props'
  }
)

export type RefreshTokenProps = Static<typeof refresh_token_props>
