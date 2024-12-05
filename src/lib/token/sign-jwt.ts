import * as jose from 'jose'
import { nanoid } from 'nanoid'

export const randomKid = (keys: jose.JWK[]) => {
  const i = Math.floor(Math.random() * keys.length)
  const kid = keys[i].kid
  if (!kid) {
    return {
      error: new Error(
        `JWK index ${i} (JWKS has size ${keys.length}) has no 'kid' (key ID) parameter`
      )
    }
  } else {
    return { value: kid }
  }
}

export interface SignConfig {
  /**
   * Expiration for the access token. A pretty common choice is to set the
   * access token lifetime to is one hour.
   */
  expiration: string

  /**
   * Issuer. The app should set the `iss` claim to the URL of the token endpoint,
   * since it's the token endpoint the one who issues the JWT.
   *
   * Example:
   *
   * ```js
   * const iss = 'https://example.com/token'
   * ```
   *
   * If you follow the OpenID Connect Discovery standard, the iss value should
   * match the URL of your `.well-known/openid-configuration` file (if you have
   * one).
   */
  issuer: string

  jwks: { keys: jose.JWK[] }

  /**
   * Key ID to use for signing the JWT. It should be a JWK from the JWKS.
   */
  kid: string

  payload: jose.JWTPayload
}

export const sign = async (config: SignConfig) => {
  // const { algorithm, expiration, issuer, payload, secret } = config
  const { expiration: exp, issuer: iss, jwks, kid, payload } = config

  const jwk = jwks.keys.find((k: any) => k.kid === kid)
  if (!jwk) {
    return { error: new Error(`JWKS has no JWK with kid=${kid}`) }
  }

  const alg = jwk.alg
  if (!alg) {
    return { error: new Error(`JWK has no alg`) }
  }

  let private_key: jose.KeyLike | Uint8Array
  try {
    private_key = await jose.importJWK(jwk)
  } catch (err: any) {
    return { error: err as Error }
  }

  const jti = nanoid()

  // If no argument is passed to setIssuedAt(), then it will use the current
  // UNIX timestamp (in seconds).
  const jwt_to_sign = new jose.SignJWT(payload)
    .setProtectedHeader({ alg, kid })
    .setExpirationTime(exp)
    .setIssuedAt()
    .setIssuer(iss)
    .setJti(jti)

  try {
    const jwt = await jwt_to_sign.sign(private_key)
    return { value: jwt }
  } catch (err) {
    return { error: err as Error }
  }
}
