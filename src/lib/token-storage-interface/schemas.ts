import { Static, Type } from '@sinclair/typebox'
import { exp, iat, jti, jwt } from '../jwt/index.js'
// import { scope } from '../oauth2/index.js'
import { failure } from '../schemas/failure.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    claims: Type.Object({ exp, jti }),
    jwt,
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

// jose.JWTPayload
const payload = Type.Object({})

const result_promise = Type.Promise(Type.Union([failure, success]))

const ISSUE_ACCESS_TOKEN_DESCRIPTION = `Function that performs the effect of persisting the access token to some storage (e.g. a database).`

const issueAccessToken_ = Type.Function([payload], result_promise, {
  description: ISSUE_ACCESS_TOKEN_DESCRIPTION
})

/**
 * Function that performs the effect of persisting the access token code to some
 * storage (e.g. a database).
 */
export type IssueAccessToken = Static<typeof issueAccessToken_>

export const issueAccessToken = Type.Any({
  description: ISSUE_ACCESS_TOKEN_DESCRIPTION
})

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
