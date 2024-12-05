import * as jose from 'jose'

export interface VerifyConfig {
  issuer: string
  jwks_url: URL
  jwt: string
  max_token_age: string
}

export const verify = async (config: VerifyConfig) => {
  const { issuer, jwks_url, jwt, max_token_age } = config

  const JWKS = jose.createRemoteJWKSet(jwks_url)

  try {
    const verify_result = await jose.jwtVerify(jwt, JWKS, {
      issuer,
      maxTokenAge: max_token_age,
      requiredClaims: ['exp', 'iat', 'iss', 'jti', 'me', 'scope']
    })
    return { value: verify_result.payload }
  } catch (err) {
    return { error: err as Error }
  }
}
