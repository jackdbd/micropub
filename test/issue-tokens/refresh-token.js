import assert from 'node:assert'
import { describe, it } from 'node:test'
import { unixTimestampInSeconds } from '../../dist/lib/date.js'
import { refreshToken } from '../../dist/lib/issue-tokens/index.js'
import { ajv, REFRESH_TOKEN_EXPIRATION_IN_SECONDS } from '../test_utils.js'

const expiration = `${REFRESH_TOKEN_EXPIRATION_IN_SECONDS} seconds`

describe('refreshToken', () => {
  it(`returns a refresh token that expires in ${REFRESH_TOKEN_EXPIRATION_IN_SECONDS} seconds`, async () => {
    const { error, value } = await refreshToken({ ajv, expiration })

    assert.ok(!error)
    const { refresh_token, exp } = value

    const now = unixTimestampInSeconds()

    assert.ok(refresh_token)
    assert.ok(exp > now)
    assert.ok(exp < now + REFRESH_TOKEN_EXPIRATION_IN_SECONDS + 1)
  })
})
