import assert from 'node:assert'
import { describe, it } from 'node:test'
import { unixTimestampInSeconds } from '../dist/lib/date.js'
import { isExpired } from '../dist/lib/predicates.js'

describe('isExpired', () => {
  it('returns true when the `exp` claim is of 1 second ago', () => {
    const now = unixTimestampInSeconds()
    const token = { exp: now - 1 }

    assert.ok(isExpired(token.exp))
  })

  it('returns false when the `exp` claim is of 1 second into the future', () => {
    const now = unixTimestampInSeconds()
    const token = { exp: now + 1 }

    assert.ok(!isExpired(token.exp))
  })
})
