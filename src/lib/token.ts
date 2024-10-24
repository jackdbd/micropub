import * as jose from 'jose'
import type { AccessTokenPayload } from '../plugins/interfaces.js'

export interface SecretConfig {
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
