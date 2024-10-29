import * as jose from 'jose'

interface AccessTokenPayload {
  me: string
  // issued_by: string
  client_id: string
  exp: number // will expire at timestamp
  iat: number // issued at timestamp
  // issued_at: number
  scope: string
  //   nonce: number
}

interface SecretConfig {
  alg: string
}

type Secret = jose.KeyLike | Uint8Array

export const secret = async ({ alg }: SecretConfig) => {
  try {
    const secret = await jose.generateSecret(alg)
    return { value: secret }
  } catch (err) {
    return { error: err as Error }
  }
}

export interface VerifyConfig {
  expiration: string
  issuer: string
  jwt: string
  secret: Secret
}

export const verify = async ({
  expiration,
  issuer,
  jwt,
  secret
}: VerifyConfig) => {
  try {
    const result = await jose.jwtVerify(jwt, secret, {
      //   audience: '',
      issuer,
      maxTokenAge: expiration,
      requiredClaims: ['exp', 'iat', 'iss', 'me', 'scope']
      //   subject: ''
    })
    return { value: result }
  } catch (err) {
    return { error: err as Error }
  }
}

export interface SignConfig {
  algorithm: string
  expiration: string
  issuer: string
  payload: jose.JWTPayload
  secret: Secret
}

export const sign = async ({
  algorithm,
  expiration,
  issuer,
  payload,
  secret
}: SignConfig) => {
  // JWT claims
  // https://www.rfc-editor.org/rfc/rfc7519#section-4
  const jwt_to_sign = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    // .setAudience()
    .setExpirationTime(expiration)
    .setIssuedAt()
    .setIssuer(issuer)
  // .setSubject()

  try {
    const jwt = await jwt_to_sign.sign(secret)
    return { value: jwt }
  } catch (err) {
    return { error: err as Error }
  }
}

export interface DecodeConfig {
  jwt: string
}

export const decode = ({ jwt }: DecodeConfig) => {
  return jose.decodeJwt(jwt) as unknown as AccessTokenPayload
}

interface ExpiredConfig {
  exp: number
}

export const isExpired = ({ exp }: ExpiredConfig) => {
  const now = Math.floor(new Date().getTime() / 1000)
  return exp - now < 0 ? true : false
}

export interface BlacklistedConfig {
  jwt: string
}

export const isBlacklisted = async ({ jwt }: BlacklistedConfig) => {
  console.log(
    `TODO: query the token database (maybe D1?) to see if JWT is blacklisted`,
    jwt
  )
  // TODO: implement this
  // const blacklisted = await Promise.resolve(true)
  const blacklisted = await Promise.resolve(false)

  return blacklisted
}

export interface RevokeConfig {
  jwt: string
}

export const revoke = async ({ jwt }: RevokeConfig) => {
  console.log(
    `TODO: tell the token database (maybe D1?) that this JWT is revoked (i.e. blacklisted)`,
    jwt
  )

  // return { error: new Error('some database error') }
  return { value: { message: `token revoked` } }
}
