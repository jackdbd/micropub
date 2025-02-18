import assert from 'node:assert'
import { describe, it, beforeEach } from 'node:test'
import { unixTimestampInSeconds } from '@jackdbd/indieauth'
import {
  PROFILE_EMAIL,
  PROFILE_NAME,
  PROFILE_PHOTO,
  PROFILE_URL,
  ME,
  userProfileAPI
} from './test_utils.js'

describe('User Profiles', () => {
  const storage = userProfileAPI()
  beforeEach(async () => {
    await storage.removeMany()
  })

  it('the record about the stored user profile has a `created_at` property greater than or equal to the current UNIX timestamp (seconds)', async () => {
    const { error, value: record } = await storage.storeOne({
      email: PROFILE_EMAIL,
      // me: ME,
      name: PROFILE_NAME,
      photo: PROFILE_PHOTO,
      url: PROFILE_URL
    })

    assert.ok(!error)
    assert.ok(record)
    assert.ok(record.created_at >= unixTimestampInSeconds())
  })
})
