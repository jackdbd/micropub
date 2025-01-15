import { Type } from '@sinclair/typebox'

export const isAccessTokenRevoked = Type.Any()

export type IsAccessTokenRevoked = (jti: string) => Promise<boolean>
