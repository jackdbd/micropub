import { Static, Type } from '@sinclair/typebox'

export const jwks_url = Type.Object(
  {
    hash: Type.String(),
    host: Type.String(),
    href: Type.String(),
    hostname: Type.String(),
    origin: Type.String(),
    password: Type.String(),
    pathname: Type.String(),
    port: Type.String(),
    protocol: Type.String(),
    search: Type.String(),
    searchParams: Type.Any(),
    username: Type.String(),
    toJSON: Type.Any()
  },
  {
    additionalProperties: true,
    description: `URL where the public JSON Web Key Set is hosted.`,
    title: 'JWKS public URL'
  }
)

export type JWKSPublicURL = Static<typeof jwks_url>

const alg = Type.String({ minLength: 1 })
const kid = Type.String({ minLength: 1 })

export const jwk_public = Type.Object({
  alg: Type.Optional(alg),
  e: Type.Optional(Type.String({ minLength: 1 })),
  kid: Type.Optional(kid),
  kty: Type.String({ minLength: 1 }),
  n: Type.Optional(Type.String({ minLength: 1 }))
})

export type JWKPublic = Static<typeof jwk_public>

export const jwks_public = Type.Object({
  keys: Type.Array(jwk_public)
})

export type JWKSPublic = Static<typeof jwks_public>

export const jwk_private = Type.Object({
  alg: Type.Optional(alg),
  d: Type.Optional(Type.String({ minLength: 1 })),
  dp: Type.Optional(Type.String({ minLength: 1 })),
  dq: Type.Optional(Type.String({ minLength: 1 })),
  e: Type.Optional(Type.String({ minLength: 1 })),
  kid: Type.Optional(kid),
  kty: Type.String({ minLength: 1 }),
  n: Type.Optional(Type.String({ minLength: 1 })),
  p: Type.Optional(Type.String({ minLength: 1 })),
  q: Type.Optional(Type.String({ minLength: 1 })),
  qi: Type.Optional(Type.String({ minLength: 1 }))
})

export type JWKPrivate = Static<typeof jwk_private>

export const jwks_private = Type.Object({
  keys: Type.Array(jwk_private)
})

export type JWKSPrivate = Static<typeof jwks_private>
