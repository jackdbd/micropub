import { Type } from '@sinclair/typebox'

export const revoked = Type.Boolean()

export const revocation_reason = Type.String({ minLength: 1 })
