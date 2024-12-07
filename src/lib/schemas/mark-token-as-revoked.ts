import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jti } from './jwt-claims.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

const result_promise = Type.Promise(Type.Union([failure, success]))

export const options = Type.Object({
  revocation_reason: Type.Optional(Type.String({ minLength: 1 }))
})

export type Options = Static<typeof options>

const markTokenAsRevoked_ = Type.Function(
  [jti, Type.Optional(options)],
  result_promise
)

export type MarkTokenAsRevoked = Static<typeof markTokenAsRevoked_>

const DESCRIPTION = `Mark a token as revoked using the \`jti\` claim of the token itself.
When revoking a token, you can provide an optional \`revocation_reason\`.`

export const markTokenAsRevoked = Type.Any({
  description: DESCRIPTION
})
