import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jf2 } from './jf2.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Any()
})

// CANNOT be used with a standard JSON Schema validator
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const result_promise = Type.Promise(Type.Union([failure, success]))

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const create_ = Type.Function([jf2], result_promise)

export type Create = Static<typeof create_>

export const create = Type.Any()
