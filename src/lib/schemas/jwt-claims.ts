import { Type } from '@sinclair/typebox'

export const exp = Type.Number({
  description: `UNIX timestamp when the JWT expires`,
  minimum: 0,
  title: 'JWT expiration'
})

export const iat = Type.Number({
  description: `UNIX timestamp when the JWT was issued`,
  minimum: 0,
  title: 'JWT issued at'
})

export const iss = Type.String({
  description: `Token issuer`,
  minLength: 1,
  title: 'JWT issuer'
})

export const jti = Type.String({
  description: `Unique identifier for the JWT`,
  minLength: 1,
  title: 'JWT jti claim'
})
