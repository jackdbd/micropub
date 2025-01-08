import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '../indieauth/index.js'
import { exp, iss, jti } from '../jwt/index.js'
import { redirect_uri, refresh_token, scope } from '../oauth2/index.js'

/**
 * Record of an issued access token.
 */
export const access_token_record = Type.Object(
  {
    client_id,
    redirect_uri,
    revoked: Type.Optional(Type.Boolean()),
    revocation_reason: Type.Optional(Type.String({ minLength: 1 }))
  },
  { description: 'Record of an issued access token' }
)

export type AccessTokenRecord = Static<typeof access_token_record>

/**
 * Record of an issued refresh token.
 */
export const refresh_token_record = Type.Object(
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
    revoked: Type.Optional(Type.Boolean()),
    revocation_reason: Type.Optional(Type.String({ minLength: 1 })),
    scope
  },
  { description: 'Record of an issued refresh token' }
)

export type RefreshTokenRecord = Static<typeof refresh_token_record>

export const access_token_table = Type.Record(jti, access_token_record, {
  description:
    'Data structure that contains all access tokens that are not yet expired.'
})

/**
 * Data structure that contains all issued access tokens that are not yet expired.
 * Expired tokens should periodically be removed from this table.
 */
export type AccessTokenTable = Static<typeof access_token_table>

export const refresh_token_table = Type.Record(
  refresh_token,
  refresh_token_record,
  {
    description:
      'Data structure that contains all refresh tokens that are not yet expired.'
  }
)

/**
 * Data structure that contains all refresh tokens that are not yet expired.
 * Expired tokens should periodically be removed from this table.
 */
export type RefreshTokenTable = Static<typeof refresh_token_table>

export type RetrieveAccessTokenRecord = (
  jti: string
) => Promise<
  | { error: Error; value: undefined }
  | { error: undefined; value: AccessTokenRecord | undefined }
>

export type StoreAccessTokenRecord = (
  jti: string,
  record: AccessTokenRecord
) => Promise<{ error: Error } | { error: undefined }>

export type JTI = string

export type RefreshToken = string
