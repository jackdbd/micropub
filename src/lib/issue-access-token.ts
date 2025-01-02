import { unixTimestampInSeconds } from './date.js'
import type { JWKSPrivate } from './schemas/index.js'
import {
  type AccessTokenClaims,
  randomKid,
  safeDecode,
  sign
} from './token/index.js'
import type { StoreAccessToken } from './token-storage-interface/index.js'

export interface Config {
  expiration: string
  issuer: string
  jwks: JWKSPrivate
  storeAccessToken: StoreAccessToken
}

export const defIssueAccessToken = (config: Config) => {
  const { expiration, issuer, jwks, storeAccessToken } = config

  const issueAccessToken = async <P extends { me: string; scope: string }>(
    payload: P
  ) => {
    const { error: kid_error, value: kid } = randomKid(jwks.keys)

    if (kid_error) {
      return { error: kid_error }
    }

    const { error: sign_error, value: access_token } = await sign({
      expiration,
      issuer,
      jwks,
      kid,
      payload
    })

    if (sign_error) {
      return { error: sign_error }
    }

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      return { error: decode_error }
    }

    const { error } = await storeAccessToken(claims)

    if (error) {
      return { error }
    }

    const { exp } = claims
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestampInSeconds()
    }

    return {
      value: {
        access_token,
        claims,
        expires_in,
        message: 'issued access token'
      }
    }
  }

  return issueAccessToken
}
