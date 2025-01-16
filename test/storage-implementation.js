import assert from 'node:assert'
import { describe, it } from 'node:test'
import { defStorage } from '../dist/lib/storage-implementations/index.js'
import { ajv } from './test_utils.js'

describe('Storage implementation', () => {
  it('cannot be created if no storage backend is specified', () => {
    const { error, value } = defStorage({ ajv })
    assert.ok(error)
    assert.ok(!value)
  })

  it('cannot be created if no execution environment is specified', () => {
    const backend = 'mem-atom'
    const { error, value } = defStorage({ ajv, backend })
    assert.ok(error)
    assert.ok(!value)
  })

  it('exposes APIs for access tokens, refresh tokens, authorization codes, client applications, user profiles', () => {
    const backend = 'mem-atom'
    const env = 'dev'
    const { error, value: storage } = defStorage({ ajv, backend, env })
    assert.ok(!error)
    assert.ok(storage)

    assert.ok(storage.access_token)
    assert.ok(storage.authorization_code)
    assert.ok(storage.client_application)
    assert.ok(storage.refresh_token)
    assert.ok(storage.user_profile)
  })

  it('exposes an API that allows CRUD operations on access tokens', () => {
    const backend = 'mem-atom'
    const { value: storage } = defStorage({ ajv, backend, env: 'dev' })

    const api = storage.access_token
    assert.ok(api.storeOne)
    assert.ok(api.removeMany)
    assert.ok(api.retrieveMany)
    assert.ok(api.retrieveOne)
    assert.ok(api.updateMany)
  })

  it('exposes an API that allows CRUD operations on refresh tokens', () => {
    const backend = 'mem-atom'
    const { value: storage } = defStorage({ ajv, backend, env: 'dev' })

    const api = storage.refresh_token
    assert.ok(api.storeOne)
    assert.ok(api.removeMany)
    assert.ok(api.retrieveMany)
    assert.ok(api.retrieveOne)
    assert.ok(api.updateMany)
  })
})
