import { accessToken, refreshToken } from '../lib/issue-tokens/index.js'
import type {
  StorageApi,
  AccessTokenImmutableRecord,
  AccessTokenMutableRecord,
  RefreshTokenImmutableRecord,
  RefreshTokenMutableRecord
} from '../lib/storage-api/index.js'

// const test_exception = new Error(`test exception in user-provided handler`)

// TODO: handle storage of an access token + refresh token in a single handler,
// so database backends can use a transaction.

interface Config {
  access_tokens_storage: StorageApi
  refresh_tokens_storage: StorageApi
  log?: {
    debug: (message: string) => void
    error: (message: string) => void
  }
}

const defaultLog = {
  debug: (..._args: any) => {},
  error: (..._args: any) => {}
}

export const defHandlers = (config: Config) => {
  const { access_tokens_storage, refresh_tokens_storage } = config

  const log = config.log ?? defaultLog

  const isAccessTokenRevoked = async (jti: string) => {
    // throw new Error(`test exception in isAccessTokenRevoked handler`)
    const { error, value: record } = await access_tokens_storage.retrieveOne({
      where: [{ key: 'jti', op: '==', value: jti }]
    })

    if (error) {
      throw error
    }

    if (!record) {
      throw new Error(`Access token jti ${jti} not found in storage`)
    }

    return record.revoked ? true : false
  }

  const retrieveAccessToken = async (jti: string) => {
    log.debug(`retrieve access token jti=${jti}`)
    throw new Error(`test exception in retrieveAccessToken handler`)
    const { error, value } = await access_tokens_storage.retrieveOne({
      where: [{ key: 'jti', op: '==', value: jti }]
    })

    if (error) {
      throw error
    }

    return value as AccessTokenImmutableRecord | AccessTokenMutableRecord
  }

  const retrieveRefreshToken = async (refresh_token: string) => {
    console.log('🚀 ~ retrieveRefreshToken ~ refresh_token:', refresh_token)
    log.debug(`retrieve refresh token ${refresh_token}`)
    // throw new Error(`test exception in retrieveRefreshToken handler`)
    const { error, value } = await refresh_tokens_storage.retrieveOne({
      where: [{ key: 'refresh_token', op: '==', value: refresh_token }]
    })

    if (error) {
      log.error(`cannot retrieve refresh token: ${error.message}`)
      throw error
    }

    log.debug(`retrieved record about refresh token ${refresh_token}`)
    console.log('🚀 ~ retrieveRefreshToken ~ record:', value)

    return value as RefreshTokenImmutableRecord | RefreshTokenMutableRecord
  }

  // Should we:
  // a. store the jti of the old access token (so it always stays the same for
  //    all refresh tokens), or
  // b. store the jti of the new access token (so it changes for each refresh
  //    token)?
  // Read the following article and decide:
  // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Refresh-Token-Automatic-Reuse-Detection

  const issueTokens = async (props: any) => {
    // throw new Error(`test exception in issueTokens handler`)

    const {
      access_token_expiration,
      client_id,
      issuer,
      // jti,
      jwks,
      me,
      redirect_uri,
      refresh_token_expiration,
      scope
    } = props

    const { error: mint_error, value } = await mintTokens({
      access_token_expiration,
      client_id,
      issuer,
      jwks,
      log,
      me,
      redirect_uri,
      refresh_token_expiration,
      scope
    })

    if (mint_error) {
      throw mint_error
    }

    const {
      access_token,
      access_token_props,
      expires_in,
      refresh_token_props
    } = value

    const { error: access_token_error, value: access_token_record } =
      await access_tokens_storage.storeOne(access_token_props)

    if (access_token_error) {
      log.error(`cannot store access token: ${access_token_error.message}`)
      throw access_token_error
    }
    log.debug(`stored record about access token jti ${access_token_props.jti}`)
    console.log('🚀 ~ access_token_record:', access_token_record)

    const { error: refresh_token_error, value: refresh_token_record } =
      await refresh_tokens_storage.storeOne(refresh_token_props)

    if (refresh_token_error) {
      console.error(
        `cannot store refresh token: ${refresh_token_error.message}`
      )
      throw access_token_error
    }
    log.debug(
      `stored record about refresh token ${refresh_token_props.refresh_token}`
    )
    console.log('🚀 ~ refresh_token_record:', refresh_token_record)

    return {
      access_token,
      expires_in,
      me,
      refresh_token: refresh_token_props.refresh_token,
      scope
    }
  }

  return {
    isAccessTokenRevoked,
    // isRefreshTokenRevoked,
    // revokeAccessToken, // for revocation endpoint
    // revokeRefreshToken, // for revocation endpoint
    retrieveAccessToken,
    retrieveRefreshToken,
    issueTokens
  }
}
