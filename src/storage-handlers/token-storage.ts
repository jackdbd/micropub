import type {
  StorageApi,
  AccessTokenImmutableRecord,
  AccessTokenMutableRecord,
  RefreshTokenImmutableRecord,
  RefreshTokenMutableRecord
} from '../lib/storage-api/index.js'
import { AccessTokenProps } from '../lib/token-storage-interface/access-token.js'
import { RefreshTokenProps } from '../lib/token-storage-interface/refresh-token.js'
import { unwrapP } from '../lib/unwrap/index.js'
import type {
  IsAccessTokenRevoked,
  OnIssuedTokens,
  RetrieveAccessToken,
  RetrieveRefreshToken
} from '../plugins/token-endpoint/index.js'
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

export const defOnIssuedTokens = (config: OnIssuedTokensConfig) => {
  const log = config.log ?? default_log

  const { batchTransaction, storage } = config

  if (!batchTransaction && !storage) {
    throw new Error(`set at least one of 'batchTransaction' and 'storage'`)
  }

  const onIssuedTokens: OnIssuedTokens = async (issued_info) => {
    log.debug(`commit issued_info to storage`, issued_info)
    // throw new Error(`test exception in onIssuedTokens`)

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
      await unwrapP(storage.access_token.storeOne(access_token_props))
      log.debug(`record about access token persisted to storage`)
      await unwrapP(storage.refresh_token.storeOne(refresh_token_props))
      log.debug(`record about refresh token persisted to storage`)
    }
  }

  return onIssuedTokens
}
