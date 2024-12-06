import * as jose from 'jose'
import type { AccessTokenClaims } from './claims.ts'

/**
 * Decodes a signed JSON Web Token payload.
 *
 * This does not validate the JWT Claims Set types or values.
 * This does not validate the JWS Signature.
 */
export const safeDecode = async (jwt: string) => {
  try {
    const value = jose.decodeJwt(jwt) as unknown as AccessTokenClaims
    return { value }
  } catch (err) {
    return { error: err as Error }
  }
}
