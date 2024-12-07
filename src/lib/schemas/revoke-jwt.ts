import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jwt } from './jwt.js'
import { jti } from './jwt-claims.js'
import { options } from './mark-token-as-revoked.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    jti,
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

// CANNOT be used with a standard JSON Schema validator
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const result_promise = Type.Promise(Type.Union([failure, success]))

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const revokeJWT_ = Type.Function([jwt, Type.Optional(options)], result_promise)

export type RevokeJWT = Static<typeof revokeJWT_>

export const revokeJWT = Type.Any()
