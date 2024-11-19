import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { defFastify } from '../dist/app.js'
import { defConfig } from '../dist/config.js'

const defTestApp = () => {
  const { error, value: config } = defConfig()
  if (error) {
    console.error(error)
  }
  assert.ok(!error)
  return defFastify(config)
}

describe('app', () => {
  let app
  before(() => {
    app = defTestApp()
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
