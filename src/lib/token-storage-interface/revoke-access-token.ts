import type { MarkTokenAsRevoked, RevokeJWT } from '../schemas/index.js'
import { verify } from '../token/index.js'

export interface Config {
  /**
   * The entity that issued the JWT, typically the Authorization Server.
   * The issuer identifier included in the server's metadata value issuer MUST
   * be identical to the `iss` parameter's value.
   * @see [RFC 9207 OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html)
   */
  issuer: string

  /**
   * The URL where a **public** JWKS can be found. Each JWT issued should have a
   * `kid` claim in the header. This `kid` identifies which JWK of the JWKS to
   * use for verifying the JWT.
   */
  jwks_url: URL

  /**
   * The function that performs the effect of marking the token as revoked and
   * persisting this information to some storage (e.g. a database).
   */
  markTokenAsRevoked: MarkTokenAsRevoked

  max_token_age: string
}

/**
 * Factory function for creating a `revokeJWT` function.
 *
 * To be able to revoke tokens, we must keep track of the tokens we issued. We
 * do this by assigning a unique identifier to each token we issue, and by
 * storing this identifier—along with some other piece of information—in some
 * persistent storage (e.g. a database, a service that provides object storage).
 */
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
