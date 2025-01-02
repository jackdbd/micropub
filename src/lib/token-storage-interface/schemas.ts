import { Static, Type } from '@sinclair/typebox'
import { exp, iat, jti } from '../jwt/index.js'

/**
 * Record of an issued access token.
 */
export const access_token_record = Type.Object({
  exp,
  iat,
  revoked: Type.Optional(Type.Boolean()),
  revocation_reason: Type.Optional(Type.String({ minLength: 1 }))
})

export type AccessTokenRecord = Static<typeof access_token_record>

export const access_token_table = Type.Record(jti, access_token_record, {
  description:
    'Data structure that contains all access tokens that are not yet expired.'
})

/**
 * Data structure that contains all issued access tokens that are not yet expired.
 * Expired tokens should be removed from this table periodically.
 */
export type AccessTokenTable = Static<typeof access_token_table>

export type GetRecord = (
  jti: string
) => Promise<
  | { error: Error; value: undefined }
  | { error: undefined; value: AccessTokenRecord | undefined }
>

export type SetRecord = (
  jti: string,
  record: AccessTokenRecord
) => Promise<{ error: Error } | { error: undefined }>
