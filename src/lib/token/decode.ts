import * as jose from 'jose'

/**
 * Decodes a signed JSON Web Token.
 *
 * This function does not validate the JWT Claims Set types or values.
 * This function does not validate the JWS Signature.
 */
export const safeDecode = async <P extends jose.JWTPayload = jose.JWTPayload>(
  jwt: string
) => {
  try {
    const value = jose.decodeJwt(jwt) as P
    return { value }
  } catch (err) {
    return { error: err as Error }
  }
}
