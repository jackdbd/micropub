import { Type } from '@sinclair/typebox'

export const jwt = Type.String({ minLength: 1 })

export { exp, iat, iss, jti } from './claims.js'
