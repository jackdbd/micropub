import * as jose from 'jose'
import { type JWKSPublicURL } from '../jwks/index.js'

export interface VerifyConfig {
  issuer: string
  // jwks_url: URL
  jwks_url: JWKSPublicURL
  jwt: string
  max_token_age?: string
}

/**
 * Verifies a JSON Web Token.
 */
export const verify = async <P extends jose.JWTPayload = jose.JWTPayload>(
  config: VerifyConfig
) => {
  const { issuer, jwks_url, jwt, max_token_age } = config

  const JWKS = jose.createRemoteJWKSet(jwks_url)

  try {
    const verify_result = await jose.jwtVerify(jwt, JWKS, {
      issuer,
      maxTokenAge: max_token_age,
      requiredClaims: ['exp', 'iat', 'iss', 'jti', 'me', 'scope']
    })
    return { value: verify_result.payload as P }
  } catch (err) {
    return { error: err as Error }
  }
}
