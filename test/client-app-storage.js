import assert from 'node:assert'
import { describe, it, beforeEach } from 'node:test'
import { unixTimestampInSeconds } from '../dist/lib/date.js'
import {
  CLIENT_ID,
  ME,
  REDIRECT_URI,
  clientApplicationAPI
} from './test_utils.js'

describe('Client Applications', () => {
  const storage = clientApplicationAPI()
  beforeEach(async () => {
    await storage.removeMany()
  })

  it('the record about the stored client application has a `created_at` property greater than or equal to the current UNIX timestamp (seconds)', async () => {
    const { error, value: record } = await storage.storeOne({
      client_id: CLIENT_ID,
      me: ME,
      redirect_uri: REDIRECT_URI
    })

    assert.ok(!error)
    assert.ok(record)
    assert.ok(record.created_at >= unixTimestampInSeconds())
  })
})
