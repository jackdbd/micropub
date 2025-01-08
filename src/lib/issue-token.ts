import ms, { StringValue } from 'ms'
import { nanoid } from 'nanoid'
import { unixTimestampInMs, unixTimestampInSeconds } from '../lib/date.js'
import { ServerError } from '../lib/fastify-errors/index.js'
import type { JWKSPrivate } from '../lib/schemas/index.js'
import {
  AccessTokenClaims,
  randomKid,
  safeDecode,
  sign
} from '../lib/token/index.js'
import type {
  StoreAccessToken,
  StoreRefreshToken
} from '../lib/token-storage-interface/index.js'

export interface Config {
  access_token_expiration: string
  client_id: string
  issuer: string
  jwks: JWKSPrivate
  me: string
  redirect_uri: string
  refresh_token_expiration: string
  scope: string
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}

export interface IssueTokenValue {
  access_token: string
  expires_in?: number
  me: string
  refresh_token: string
  scope: string
}

/**
 * Issues an access token and a refresh token. Persist both tokens to storage.
 */
export const issueToken = async (config: Config) => {
  const {
    access_token_expiration,
    client_id,
    issuer,
    jwks,
    me,
    redirect_uri,
    refresh_token_expiration,
    scope,
    storeAccessToken,
    storeRefreshToken
  } = config

  const { error: kid_error, value: kid } = randomKid(jwks.keys)

  if (kid_error) {
    const error_description = kid_error.message
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  const { error: sign_error, value: access_token } = await sign({
    expiration: access_token_expiration,
    issuer,
    jwks,
    kid,
    payload: { me, scope }
  })

  if (sign_error) {
    const error_description = sign_error.message
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  // We need to decode the token we have just issued because we need to store
  // a few of its claims in the issue table.
  const { error: decode_error, value: claims } =
    await safeDecode<AccessTokenClaims>(access_token)

  if (decode_error) {
    const error_description = decode_error.message
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  const { error: store_access_token_error } = await storeAccessToken({
    client_id,
    jti: claims.jti,
    redirect_uri
  })

  if (store_access_token_error) {
    const error_description = store_access_token_error.message
    // const error_description = `Cannot store access token: ${store_access_token_error.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  let expires_in: number | undefined
  if (claims.exp) {
    expires_in = claims.exp - unixTimestampInSeconds()
  }

  const refresh_token = nanoid()

  const exp = Math.floor(
    (unixTimestampInMs() + ms(refresh_token_expiration as StringValue)) / 1000
  )

  const { error: store_refresh_token_error } = await storeRefreshToken({
    client_id,
    exp,
    iss: claims.iss,
    // Should we:
    // a. store the jti of the old access token (so it always stays the same for
    //    all refresh tokens), or
    // b. store the jti of the new access token (so it changes for each refresh
    //    token)?
    // Read the following article and decide:
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Refresh-Token-Automatic-Reuse-Detection
    jti: claims.jti,
    me,
    redirect_uri,
    refresh_token,
    scope
  })

  if (store_refresh_token_error) {
    const error_description = `Cannot store refresh token: ${store_refresh_token_error.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  const value: IssueTokenValue = {
    access_token,
    expires_in,
    me,
    refresh_token,
    scope
  }

  return { value }
}
