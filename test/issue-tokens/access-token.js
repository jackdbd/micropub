import assert from 'node:assert'
import { describe, it } from 'node:test'
import { accessToken } from '../../dist/lib/issue-tokens/index.js'
import {
  ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
  ajv,
  assertTokenHasExpectedClaims,
  jwks,
  REQUIRED_CLAIMS
} from '../test_utils.js'

const issuer = 'https://authorization-server.com/'
const expiration = `${ACCESS_TOKEN_EXPIRATION_IN_SECONDS} seconds`

describe('accessToken', () => {
  it(`returns an access token that expires in ${ACCESS_TOKEN_EXPIRATION_IN_SECONDS} seconds`, async () => {
    const me = 'https://example.com/me'
    const scope = 'create update profile email'

    const { error, value } = await accessToken({
      ajv,
      expiration,
      issuer,
      jwks,
      me,
      scope
    })

    assert.ok(!error)
    assert.ok(value)
    assert.ok(value.access_token)
    assert.equal(value.expires_in, ACCESS_TOKEN_EXPIRATION_IN_SECONDS)
  })

  it(`returns an access token that has these JWT claims: ${REQUIRED_CLAIMS.join(
    ', '
  )}`, async () => {
    const me = 'https://example.com/me'
    const scope = 'create update profile email'

    const { error, value } = await accessToken({
      ajv,
      expiration,
      issuer,
      jwks,
      me,
      scope
    })

    assert.ok(!error)
    await assertTokenHasExpectedClaims({
      jwt: value.access_token,
      claims: [...REQUIRED_CLAIMS, 'me', 'scope']
    })
  })
})
