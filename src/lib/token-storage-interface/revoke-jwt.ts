import type { MarkTokenAsRevoked, RevokeJWT } from '../schemas/index.js'
import { verify } from '../token/index.js'

export interface Config {
  issuer: string
  jwks_url: URL
  markTokenAsRevoked: MarkTokenAsRevoked
  max_token_age: string
}

export const defRevokeJWT = (config: Config) => {
  const { issuer, jwks_url, markTokenAsRevoked, max_token_age } = config

  const revokeJWT: RevokeJWT = async (jwt, options) => {
    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age
    })

    if (verify_error) {
      return { error: verify_error }
    }

    const { jti } = claims
    if (!jti) {
      return { error: new Error(`token was verified but it has no jti claim`) }
    }

    const { error, value } = await markTokenAsRevoked(jti, options)

    if (error) {
      return { error }
    }

    // The token revocation implementation might return a more detailed message,
    // so it's probably better to return that instead.
    let message: string
    if (value.message) {
      message = value.message
    } else {
      message = `Token ${jti} is revoked`
    }

    return { value: { jti, message } }
  }

  return revokeJWT
}
