import assert from 'node:assert'
import { describe, it, beforeEach } from 'node:test'
import { unixTimestampInSeconds } from '@jackdbd/indieauth'
import { codeChallenge, codeVerifier } from '@jackdbd/pkce'
import { nanoid } from 'nanoid'
import {
  authorizationCodeAPI,
  AUTHORIZATION_CODE_EXPIRATION_IN_SECONDS,
  CLIENT_ID,
  ME,
  REDIRECT_URI,
  SCOPE
} from './test_utils.js'

describe('Authorization Codes', () => {
  const storage = authorizationCodeAPI()

  beforeEach(async () => {
    await storage.removeMany()
  })

  it('the record about the stored authorization code has a `created_at` property greater than or equal to the current UNIX timestamp (seconds)', async () => {
    const code_verifier = codeVerifier({ len: 43, seed: 123 })
    const method = 'S256'
    const code_challenge = codeChallenge({ method, code_verifier })
    const exp =
      unixTimestampInSeconds() + AUTHORIZATION_CODE_EXPIRATION_IN_SECONDS

    const { error, value: record } = await storage.storeOne({
      client_id: CLIENT_ID,
      code: nanoid(),
      code_challenge,
      code_challenge_method: method,
      exp,
      me: ME,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE
    })

    assert.ok(!error)
    assert.ok(record)
    assert.ok(record.created_at >= unixTimestampInSeconds())
  })
})
