import ms, { StringValue } from 'ms'
import { nanoid } from 'nanoid'
import { unixTimestampInMs } from '../date.js'
import {
  type AccessTokenClaims,
  randomKid,
  safeDecode,
  sign
} from '../token/index.js'
import type {
  AccessTokenProps,
  RefreshTokenProps
} from '../token-storage-interface/index.js'
import type { Config } from './schemas.js'

const defaultLog = {
  debug: (..._args: any) => {},
  error: (..._args: any) => {}
}

export const mintTokens = async (config: Config) => {
  const {
    access_token_expiration,
    client_id,
    issuer,
    jwks,
    me,
    redirect_uri,
    refresh_token_expiration,
    scope
  } = config

  const log = config.log ?? defaultLog

  const { error: kid_error, value: kid } = randomKid(jwks.keys)

  if (kid_error) {
    return { error: kid_error }
  }

  log.debug(`use JWK ID ${kid} to sign the JWT`)

  const { error: sign_error, value: access_token } = await sign({
    expiration: access_token_expiration,
    issuer,
    jwks,
    kid,
    payload: { me, scope }
  })

  if (sign_error) {
    return { error: sign_error }
  }

  log.debug(`access token signed by issuer ${issuer} for client ${client_id}`)

  // We need to decode the token we have just issued because we need to store
  // a few of its claims in the issue table.
  const { error: decode_error, value: claims } =
    await safeDecode<AccessTokenClaims>(access_token)

  if (decode_error) {
    return { error: decode_error }
  }

  const jti = claims.jti

  const expires_in = Math.floor(
    ms(access_token_expiration as StringValue) / 1000
  )

  log.debug(`access token jti ${jti} expires in ${expires_in} seconds`)

  const access_token_props: AccessTokenProps = {
    jti,
    client_id,
    redirect_uri
  }

  // TODO: should I really make it optional to issue a refresh token? It seems
  // silly not to issue a refresh token.

  const refresh_token = nanoid()

  const exp = Math.floor(
    (unixTimestampInMs() + ms(refresh_token_expiration as StringValue)) / 1000
  )

  log.debug(
    `refresh token ${refresh_token} expires at ${exp} (${refresh_token_expiration})`
  )

  const refresh_token_props: RefreshTokenProps = {
    client_id,
    iss: issuer,
    exp,
    jti,
    me,
    redirect_uri,
    refresh_token,
    scope
  }

  return {
    value: {
      access_token,
      access_token_props,
      expires_in,
      refresh_token_props
    }
  }
}
