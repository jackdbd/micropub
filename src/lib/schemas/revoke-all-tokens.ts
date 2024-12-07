import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'

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

const revokeAllTokens_ = Type.Function([options], result_promise)

export type RevokeAllTokens = Static<typeof revokeAllTokens_>

export const revokeAllTokens = Type.Any()
