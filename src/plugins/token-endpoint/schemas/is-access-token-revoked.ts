import { Static, Type } from '@sinclair/typebox'
import { jti } from '../../../lib/jwt/index.js'

const description = `Predicate function that returns true if a jti (JSON Web 
Token ID) is revoked.`

const title = 'isAccessTokenRevoked'

// AFAIK, Type.Function and Type.Promise cannot be used with a standard JSON
// Schema validators. However, we can still use them to generate TypeScript types.
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const isAccessTokenRevoked_ = Type.Function(
  [jti],
  Type.Promise(Type.Boolean()),
  { description, title }
)

/**
 * Predicate function that returns true if a jti (JSON Web Token ID) is revoked.
 * This function will most likely need to access a storage backend in order to
 * come up with an answer.
 */
export type IsAccessTokenRevoked = Static<typeof isAccessTokenRevoked_>

/**
 * Predicate function that returns true if a jti (JSON Web Token ID) is revoked.
 * This function will most likely need to access a storage backend in order to
 * come up with an answer.
 */
export const isAccessTokenRevoked = Type.Any({ description, title })
