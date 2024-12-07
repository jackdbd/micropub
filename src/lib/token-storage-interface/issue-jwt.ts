import type { JWK } from 'jose'
import type { AddToIssuedTokens, IssueJWT } from '../schemas/index.js'
import { randomKid, safeDecode, sign } from '../token/index.js'
import type { AccessTokenClaims } from '../token/claims.js'

export interface Config {
  addToIssuedTokens: AddToIssuedTokens
  expiration: string
  issuer: string
  jwks: { keys: JWK[] }
}

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
    // a few of its claims in the issuelist.
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
      value: { message: `Token signed and added to the issuelist`, jwt, claims }
    }
  }

  return issueJWT
}
