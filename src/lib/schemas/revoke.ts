import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jwt } from './jwt.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Any()
})

// CANNOT be used with a standard JSON Schema validator
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const result_promise = Type.Promise(Type.Union([failure, success]))

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const revoke_ = Type.Function([jwt], result_promise)

export type Revoke = Static<typeof revoke_>

export const revoke = Type.Any()
