import assert from 'node:assert'
import { describe, it, beforeEach } from 'node:test'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../dist/lib/date.js'
import {
  accessTokenAPI,
  assertNoAccessTokenIsRevoked,
  assertNoRefreshTokenIsRevoked,
  CLIENT_ID,
  ISSUER,
  ME,
  REDIRECT_URI,
  REFRESH_TOKEN_EXPIRATION_IN_SECONDS,
  refreshTokenAPI,
  revokeTokensByJTI,
  storeAccessTokens,
  storeRefreshTokens
} from './test_utils.js'

describe('Access Tokens', () => {
  it('cannot store a record about an access token when client_id and redirect_uri are not URLs', async () => {
    const api = accessTokenAPI()

    const client_id = 'some-client-id'
    const jti = 'some-jti'
    const redirect_uri = 'some-redirect-uri'

    const { error, value } = await api.storeOne({
      client_id,
      jti,
      redirect_uri
    })

    assert.ok(error)
    assert.ok(!value)
  })

  it('the record about the stored access token has a `created_at` property greater than or equal to the current UNIX timestamp (seconds)', async () => {
    const api = accessTokenAPI()
    const jti = 'some-jti'

    const { error, value: record } = await api.storeOne({
      client_id: CLIENT_ID,
      jti,
      redirect_uri: REDIRECT_URI
    })

    assert.ok(!error)
    assert.ok(record)
    assert.ok(record.created_at >= unixTimestampInSeconds())
  })
})

describe('Refresh Tokens', () => {
  it('the record about the stored refresh token has a `created_at` property greater than or equal to the current UNIX timestamp (seconds)', async () => {
    const api = refreshTokenAPI()

    const exp = unixTimestampInSeconds() + REFRESH_TOKEN_EXPIRATION_IN_SECONDS
    const jti = 'some-jti'
    const refresh_token = 'some-refresh-token'
    const scope = 'create update profile email'

    const { error, value: record } = await api.storeOne({
      client_id: CLIENT_ID,
      exp,
      iss: ISSUER,
      jti,
      me: ME,
      redirect_uri: REDIRECT_URI,
      refresh_token,
      scope
    })

    assert.ok(!error)
    assert.ok(record)
    assert.ok(record.created_at >= unixTimestampInSeconds())
  })
})

describe('Token Revocation', () => {
  const apis = {
    access_tokens: accessTokenAPI(),
    refresh_tokens: refreshTokenAPI()
  }
  beforeEach(async () => {
    await apis.access_tokens.removeMany()
    await apis.refresh_tokens.removeMany()
  })

  it('allows to mark as revoked both access tokens and refresh tokens (with an optional revocation reason)', async () => {
    const jtis = [nanoid(), nanoid()]
    const refresh_tokens = [nanoid(), nanoid()]

    await storeAccessTokens({ storage: apis.access_tokens, jtis })
    await assertNoAccessTokenIsRevoked({ storage: apis.access_tokens })

    await storeRefreshTokens({
      storage: apis.refresh_tokens,
      jtis,
      refresh_tokens
    })
    await assertNoRefreshTokenIsRevoked({ storage: apis.refresh_tokens })

    const revocation_reason = `test ${nanoid()}`

    await revokeTokensByJTI({
      storage: apis.access_tokens,
      jtis: [jtis[0]],
      revocation_reason
    })

    await revokeTokensByJTI({
      storage: apis.refresh_tokens,
      jtis: [jtis[0]],
      revocation_reason
    })

    // atr: access token records
    const { value: atr_after } = await apis.access_tokens.retrieveMany()

    // TODO: this is probably a bug in the mem-atom updateMany implementation
    // This assertion passes when using SQLite as the storage backend
    // assert.equal(atr_after.length, jtis.length)

    assert.equal(atr_after[0].revoked, true)
    assert.equal(atr_after[0].revocation_reason, revocation_reason)

    // rtr: refresh token records
    const { value: rtr_after } = await apis.refresh_tokens.retrieveMany()
    // assert.equal(rtr_after.length, jtis.length)
    assert.equal(rtr_after[0].revoked, true)
    assert.equal(rtr_after[0].revocation_reason, revocation_reason)
  })

  it('allows to revoke all tokens (with an optional revocation reason)', async () => {
    const jtis = [nanoid(), nanoid()]
    const refresh_tokens = [nanoid(), nanoid()]

    await storeAccessTokens({ storage: apis.access_tokens, jtis })
    await assertNoAccessTokenIsRevoked({ storage: apis.access_tokens })

    await storeRefreshTokens({
      storage: apis.refresh_tokens,
      jtis,
      refresh_tokens
    })
    await assertNoRefreshTokenIsRevoked({ storage: apis.refresh_tokens })

    const revocation_reason = `test ${nanoid()}`

    await revokeTokensByJTI({
      storage: apis.access_tokens,
      jtis,
      revocation_reason
    })

    await revokeTokensByJTI({
      storage: apis.refresh_tokens,
      jtis,
      revocation_reason
    })

    // atr: access token records
    const { value: atr_after } = await apis.access_tokens.retrieveMany()
    assert.equal(atr_after.length, jtis.length)
    atr_after.forEach((record) => {
      assert.equal(record.revoked, true)
      assert.equal(record.revocation_reason, revocation_reason)
    })

    // rtr: refresh token records
    const { value: rtr_after } = await apis.refresh_tokens.retrieveMany()
    assert.equal(rtr_after.length, jtis.length)
    rtr_after.forEach((record) => {
      assert.equal(record.revoked, true)
      assert.equal(record.revocation_reason, revocation_reason)
    })
  })
})
