import type {
  RetrieveRecord,
  SelectQuery,
  StoreRecord
} from '../lib/storage-api/index.js'
import { secondsToUTCString, unixTimestampInSeconds } from './date.js'
import type { JWKSPublicURL } from './schemas/index.js'
import { type AccessTokenClaims, verify } from './token/index.js'

export interface Config {
  issuer: string
  jwks_url: JWKSPublicURL
  max_token_age: string
  retrieveAccessToken: RetrieveRecord
  storeAccessToken: StoreRecord
}

export interface Options {
  revocation_reason?: string
}

export const defRevokeAccessToken = (config: Config) => {
  const {
    issuer,
    jwks_url,
    max_token_age,
    retrieveAccessToken,
    storeAccessToken
  } = config

  const revokeAccessToken = async (access_token: string, options?: Options) => {
    const opt = options || {}
    const { error: verify_error, value: claims } =
      await verify<AccessTokenClaims>({
        issuer,
        jwks_url,
        jwt: access_token,
        max_token_age
      })

    if (verify_error) {
      return { error: verify_error }
    }

    const query: SelectQuery = {
      select: ['*'],
      where: [{ key: 'jti', op: '==', value: claims.jti }]
    }

    const { error: retrieve_error, value: record } = await retrieveAccessToken(
      query
    )

    if (retrieve_error) {
      return { error: retrieve_error }
    }

    if (!claims.me) {
      const message = 'Cannot revoke token because it has no `me` claim.'
      return { value: { message } }
    }

    if (!claims.jti) {
      const message = 'Cannot revoke token because it has no `jti` claim.'
      return { value: { message } }
    }

    if (!claims.scope) {
      const message = 'Cannot revoke token because it has no `scope` claim.'
      return { value: { message } }
    }

    if (!claims.exp) {
      const message = 'Cannot revoke token because it has no `exp` claim.'
      return { value: { message } }
    }

    const unix_now = unixTimestampInSeconds()
    if (claims.exp < unix_now) {
      const exp = secondsToUTCString(claims.exp)
      const now = secondsToUTCString(unix_now)
      const message = `Nothing to revoke, since the access token expired at ${exp} (now is ${now}).`
      return { value: { message } }
    }

    const { error: revoke_error, value } = await storeAccessToken({
      ...record,
      jti: claims.jti,
      revoked: true,
      revocation_reason: opt.revocation_reason
    })

    if (revoke_error) {
      return { error: revoke_error }
    }

    return { value: { message: value.message, jti: claims.jti } }
  }

  return revokeAccessToken
}
