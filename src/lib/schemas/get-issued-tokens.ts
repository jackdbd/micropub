import { Static, Type } from '@sinclair/typebox'
import { jti } from '../jwt/index.js'
import { failure } from './failure.js'

const jtis = Type.Array(jti)

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    jtis,
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

const result_promise = Type.Promise(Type.Union([failure, success]))

const getIssuedTokens_ = Type.Function([], result_promise)

export type GetIssuedTokens = Static<typeof getIssuedTokens_>

export const getIssuedTokens = Type.Any()
