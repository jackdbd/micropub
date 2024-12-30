import { Static, Type } from '@sinclair/typebox'
import { client_id, me, redirect_uri } from '../indieauth/index.js'
import { exp } from '../jwt/index.js'
import { scope } from '../oauth2/index.js'

/**
 * Authorization code issued by the authorization endpoint.
 *
 * OAuth 2.0 does not define a specific format for the authorization code issued
 * by the authorization endpoint. IndieAuth specifies that the authorization
 * code should be a single-use, unguessable, random string. However, it does not
 * prescribe a particular length, encoding, or algorithm to generate the code.
 */
export const code = Type.String({
  minLength: 10,
  maxLength: 128,
  description:
    'Authorization code issued by the authorization endpoint. It should be a single-use, unguessable, random string.'
})

/**
 * Authorization code issued by the authorization endpoint.
 */
export type Code = Static<typeof code>

/**
 * Record of an issued authorization code. It contains details about the client
 * and the user the code was issued for, ensuring the code can't be used outside
 * its intended context. The `used` flag should be used to prevent replay
 * attacks.
 */
export const code_record = Type.Object(
  {
    client_id,
    exp,
    me,
    redirect_uri,
    scope,
    used: Type.Optional(Type.Boolean())
  },
  { description: 'Record of an issued authorization code' }
)

export type CodeRecord = Static<typeof code_record>

export const code_table = Type.Record(code, code_record, {
  description:
    'Data structure that contains all authorization codes that are not yet expired.'
})

/**
 * Data structure that contains all authorization codes that are not yet expired.
 * Expired authorization codes should be removed from this table periodically.
 */
export type CodeTable = Static<typeof code_table>

export type GetRecord = (
  code: Code
) => Promise<
  | { error: Error; value: undefined }
  | { error: undefined; value: CodeRecord | undefined }
>

export type SetRecord = (
  code: Code,
  record: CodeRecord
) => Promise<{ error: Error } | { error: undefined }>
