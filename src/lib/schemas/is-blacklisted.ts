import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jti } from './jwt-claims.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Boolean()
})

// CANNOT be used with a standard JSON Schema validator
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const result_promise = Type.Promise(Type.Union([failure, success]))

export type ResultPromise = Static<typeof result_promise>

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const isBlacklisted_ = Type.Function([jti], result_promise)

/**
 * Returns true if a jti (JSON Web Token ID) is blacklisted.
 */
export type IsBlacklisted = Static<typeof isBlacklisted_>

// This is INCORRECT. This schema does not validate a function but a description
// of one. Also, it CANNOT be used with a standard JSON Schema validator because
// the return type is Type.Promise().
// const isBlacklisted = Type.Object({
//   type: Type.Literal('function'),
//   accepts: Type.Array(jti), // parameters types
//   returns: result_promise // return type
// })

// This is INCORRECT. This schema does not validate a function but a description
// of one. This CAN be used because we are not using Type.Promise() for its
// return type.
// const isBlacklisted = Type.Object({
//   type: Type.Literal('function'),
//   accepts: Type.Array(jti), // parameters types
//   returns: Type.Any() // return type
// })

// This can be used, but of course is not that useful.
export const isBlacklisted = Type.Any()
