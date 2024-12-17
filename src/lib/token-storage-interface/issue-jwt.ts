import type { JWK } from 'jose'
import type { AddToIssuedTokens, IssueJWT } from '../schemas/index.js'
import { randomKid, safeDecode, sign } from '../token/index.js'
import type { AccessTokenClaims } from '../token/claims.js'

export interface Config {
  /**
   * The function that performs the effect of persisting the token to some
   * storage (e.g. storing it in a database).
   */
  addToIssuedTokens: AddToIssuedTokens

  /**
   * The time after which the token is invalid.
   */
  expiration: string

  /**
   * The entity that issued the JWT, typically the Authorization Server.
   * The issuer identifier included in the server's metadata value issuer MUST
   * be identical to the `iss` parameter's value.
   * @see [RFC 9207 OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html)
   */
  issuer: string

  /**
   * The **private** JWKS that we will use to sign the JWT we issue. The actual
   * JWK that will be used to sign the JWT will be selected at random from all
   * the JWKs in the JWKS.
   */
  jwks: { keys: JWK[] }
}

/**
 * Factory function for creating an `issueJWT` function.
 *
 * To be able to revoke tokens, we must keep track of the tokens we issued. We
 * do this by assigning a unique identifier to each token we issue, and by
 * storing this identifier—along with some other piece of information—in some
 * persistent storage (e.g. a database, a service that provides object storage).
 */
export const defIssueJWT = (config: Config) => {
  const { addToIssuedTokens, expiration, issuer, jwks } = config

  const issueJWT: IssueJWT = async (payload) => {
    const { error: kid_error, value: kid } = randomKid(jwks.keys)

    if (kid_error) {
      return { error: kid_error }
    }

    const { error: sign_error, value: jwt } = await sign({
      expiration,
      issuer,
      jwks,
      kid,
      payload
    })

    if (sign_error) {
      return { error: sign_error }
    }

    // We need to decode the token we have just issued because we need to store
    // a few of its claims in the issue table.
    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(jwt)

    if (decode_error) {
      return { error: decode_error }
    }

    const { error } = await addToIssuedTokens(claims)

    if (error) {
      return { error }
    }

    return {
      value: {
        message: `Token signed and added to the issue table`,
        jwt,
        claims
      }
    }
  }

  return issueJWT
}
