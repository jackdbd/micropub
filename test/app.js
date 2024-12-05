import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { defTestApp } from './test_utils.js'

describe('app', () => {
  let app
  before(async () => {
    app = await defTestApp()
  })

  after(() => {
    app.close()
  })

  it('serves the home page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    })

    assert.strictEqual(response.statusCode, 200)
    assert.ok(response.body)
  })
})
