import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jf2 } from './jf2.js'
import { location } from './location.js'

const sha = Type.String({ minLength: 1 })

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    jf2,
    sha: Type.Optional(sha)
  })
})

// CANNOT be used with a standard JSON Schema validator
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const result_promise = Type.Promise(Type.Union([failure, success]))

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const get_ = Type.Function([location], result_promise)

export type Get = Static<typeof get_>

export const get = Type.Any()
