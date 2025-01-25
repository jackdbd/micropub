import type {
  AccessTokenProps,
  AccessTokenImmutableRecord,
  AccessTokenMutableRecord,
  IsAccessTokenRevoked,
  OnIssuedTokens,
  RefreshTokenProps,
  RefreshTokenImmutableRecord,
  RefreshTokenMutableRecord
} from '@jackdbd/fastify-token-endpoint'
import type {
  RetrieveAccessToken,
  RetrieveRefreshToken,
  RevokeAccessToken,
  RevokeRefreshToken
} from '@jackdbd/fastify-revocation-endpoint'
import type { StorageApi } from '../lib/storage-api/index.js'
import { unwrapP } from '@jackdbd/unwrap'
import { SQLITE_DATABASE_TABLE } from '../constants.js'
import type { BatchTransaction } from '../sqlite-utils.js'
import { default_log, type Log } from './logger.js'

export interface RetrieveConfig {
  log?: Log
  storage: StorageApi
}

export const defIsAccessTokenRevoked = (config: RetrieveConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const isAccessTokenRevoked: IsAccessTokenRevoked = async (jti) => {
    log.debug(`retrieve access token jti=${jti} from storage`)
    // throw new Error(`test exception in isAccessTokenRevoked`)
    const record = await unwrapP(
      storage.retrieveOne({
        where: [{ key: 'jti', op: '==', value: jti }]
      })
    )

    log.debug(`check whether access token jti=${jti} is revoked or not`)
    return record.revoked ? true : false
  }

  return isAccessTokenRevoked
}

export const defRetrieveAccessToken = (config: RetrieveConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const retrieveAccessToken: RetrieveAccessToken = async (jti) => {
    log.debug(`retrieve access token jti=${jti} from storage`)
    // throw new Error(`test exception in retrieveAccessToken`)
    const record = await unwrapP(
      storage.retrieveOne({
        where: [{ key: 'jti', op: '==', value: jti }]
      })
    )

    return record as AccessTokenImmutableRecord | AccessTokenMutableRecord
  }

  return retrieveAccessToken
}

export const defRetrieveRefreshToken = (config: RetrieveConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const retrieveRefreshToken: RetrieveRefreshToken = async (refresh_token) => {
    log.debug(`retrieve refresh token ${refresh_token} from storage`)
    const record = await unwrapP(
      storage.retrieveOne({
        where: [{ key: 'refresh_token', op: '==', value: refresh_token }]
      })
    )
    return record as RefreshTokenImmutableRecord | RefreshTokenMutableRecord
  }

  return retrieveRefreshToken
}

interface OnIssuedTokensConfig {
  log?: Log
  batchTransaction?: BatchTransaction
  storage?: { access_token: StorageApi; refresh_token: StorageApi }
}

export interface IssueTokensConfig {
  client_id: string
  me: string
  redirect_uri: string
  scope: string
}

// TODO: decide whether to issue a refresh token only if `offline_access` is
// included in `scope`.
// The offline_access scope is specified only in OpenID Connect. It's not
// mentioned in OAuth 2.0 or IndieAuth.
// https://github.com/manfredsteyer/angular-oauth2-oidc/issues/1241
// https://github.com/GluuFederation/oxAuth/issues/1172
// https://openid.net/specs/openid-connect-basic-1_0.html#OfflineAccessPrivacy

/**
 * Defines an effect handler that writes access tokens and refresh tokens to the
 * specified storage backend.
 */
export const defOnIssuedTokens = (config: OnIssuedTokensConfig) => {
  const log = config.log ?? default_log

  const { batchTransaction, storage } = config

  if (!batchTransaction && !storage) {
    throw new Error(`set at least one of 'batchTransaction' and 'storage'`)
  }

  if (batchTransaction) {
    log.debug(`storage backend supports batch transactions`)
  }

  const onIssuedTokens: OnIssuedTokens = async (issued_info) => {
    const {
      client_id,
      issuer,
      jti,
      me,
      redirect_uri,
      refresh_token,
      refresh_token_expires_at: exp,
      scope
    } = issued_info

    const access_token_props: AccessTokenProps = {
      client_id,
      jti,
      redirect_uri
    }

    // Regarding what we store about refresh tokens... should we:
    // a. store the jti of the old access token (so it always stays the same for
    //    all refresh tokens), or
    // b. store the jti of the new access token (so it changes for each refresh
    //    token)?
    // Read the following article and decide:
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Refresh-Token-Automatic-Reuse-Detection

    const refresh_token_props: RefreshTokenProps = {
      client_id,
      exp,
      iss: issuer,
      jti,
      me,
      redirect_uri,
      refresh_token,
      scope
    }

    if (batchTransaction) {
      log.debug(
        `storing access token jti=${jti} and refresh token ${refresh_token} using a batch transaction`
      )
      const value = await unwrapP(
        batchTransaction({
          inserts: [
            {
              table: SQLITE_DATABASE_TABLE.access_token,
              props: access_token_props
            },
            {
              table: SQLITE_DATABASE_TABLE.refresh_token,
              props: refresh_token_props
            }
          ]
        })
      )
      log.debug(value.message)
    } else {
      if (!storage) {
        throw new Error(`[token-storage] 'storage' not set`)
      }
      log.debug(`storing access token jti=${jti}`)
      await unwrapP(storage.access_token.storeOne(access_token_props))
      log.debug(`stored access token jti=${jti} `)

      log.debug(`storing refresh token ${refresh_token}`)
      await unwrapP(storage.refresh_token.storeOne(refresh_token_props))
      log.debug(`stored refresh token ${refresh_token} `)
    }
  }

  return onIssuedTokens
}

interface RevokeConfig {
  log: Log
  storage: StorageApi
}

export const defRevokeAccessToken = (config: RevokeConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const revokeAccessToken: RevokeAccessToken = async (props) => {
    const { jti, revocation_reason } = props
    log.debug(`revoking access token jti=${jti}`)
    const records = await unwrapP(
      storage.updateMany({
        where: [{ key: 'jti', op: '==', value: jti }],
        set: { revoked: true, revocation_reason },
        returning: ['*']
      })
    )
    log.debug(`revoked access token jti=${jti}`, records)
  }

  return revokeAccessToken
}

export const defRevokeRefreshToken = (config: RevokeConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const revokeRefreshToken: RevokeRefreshToken = async (props) => {
    const { refresh_token, revocation_reason } = props
    log.debug(`revoking refresh token ${refresh_token}`)
    const records = await unwrapP(
      storage.updateMany({
        where: [{ key: 'refresh_token', op: '==', value: refresh_token }],
        set: { revoked: true, revocation_reason },
        returning: ['*']
      })
    )
    log.debug(`revoked refresh tokens ${refresh_token}`, records)
  }

  return revokeRefreshToken
}
