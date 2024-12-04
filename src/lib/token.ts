import * as jose from 'jose'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from './date.js'

/**
 * Claims in an access token.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7519#section-4
 */
export interface AccessTokenClaims {
  /**
   * (Expiration Time): Indicates the UNIX timestamp (in seconds) at which the
   * access token expires.
   */
  exp: number

  /**
   * (Issued At): Specifies the UNIX timestamp (in seconds) at which the access
   * token was issued.
   */
  iat: number

  /**
   * (Issuer): Specifies the issuer of the access token, typically the
   * authorization server.
   */
  iss: string

  /**
   * (JWT ID): A unique identifier for the access token. Useful for revoking the
   * token.
   */
  jti: string

  me: string

  /**
   * Space-separated list of permissions granted to the access token.
   */
  scope: string
}

interface SecretConfig {
  alg: string
}

export type Secret = jose.KeyLike | Uint8Array

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

export const verify = async (config: VerifyConfig) => {
  const { expiration, issuer, jwt, secret } = config
  try {
    const result = await jose.jwtVerify(jwt, secret, {
      issuer,
      maxTokenAge: expiration,
      requiredClaims: ['exp', 'iat', 'iss', 'jti', 'me', 'scope']
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

export const sign = async (config: SignConfig) => {
  const { algorithm, expiration, issuer, payload, secret } = config

  // If no argument is passed to setIssuedAt(), then it will use the current
  // UNIX timestamp (in seconds).
  const jwt_to_sign = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: algorithm })
    .setExpirationTime(expiration)
    .setJti(nanoid())
    .setIssuedAt()
    .setIssuer(issuer)

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
  return jose.decodeJwt(jwt) as unknown as AccessTokenClaims
}

export const safeDecode = async (jwt: string) => {
  try {
    const value = jose.decodeJwt(jwt) as unknown as AccessTokenClaims
    return { value }
  } catch (err) {
    return { error: err as Error }
  }
}

interface ExpiredConfig {
  exp: number
}

export const isExpired = ({ exp }: ExpiredConfig) => {
  return exp - unixTimestampInSeconds() < 0 ? true : false
}

export interface BlacklistedConfig {
  jwt: string
}

export const isBlacklisted = async (_config: BlacklistedConfig) => {
  // TODO: implement this
  // const blacklisted = await Promise.resolve(true)
  const blacklisted = await Promise.resolve(false)

  return blacklisted
}

export interface RevokeConfig {
  jwt: string
}

export const revoke = async (config: RevokeConfig) => {
  const { jwt } = config

  const { error, value: claims } = await safeDecode(jwt)

  if (error) {
    return { error }
  }

  const jti = claims.jti

  console.log(
    `TODO: tell the token database (maybe D1?) that this JWT is revoked (i.e. blacklisted)`,
    jwt
  )

  // return { error: new Error('some database error') }
  return { value: { message: `token ${jti} revoked` } }
}
