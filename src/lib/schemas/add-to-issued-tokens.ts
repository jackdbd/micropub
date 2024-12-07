import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { exp, iat, jti } from './jwt-claims.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const result_promise = Type.Promise(Type.Union([failure, success]))

const claims = Type.Object({
  exp,
  iat,
  jti
})

const addToIssuedTokens_ = Type.Function([claims], result_promise)

export type AddToIssuedTokens = Static<typeof addToIssuedTokens_>

export const addToIssuedTokens = Type.Any()
