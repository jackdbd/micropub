import { describe, it } from 'node:test'
import assert from 'node:assert'
import { serverMetadata } from '../../dist/lib/indieauth/index.js'

describe('serverMetadata', () => {
  it('retrieves the authorization server metadata from my site', async () => {
    const metadata_endpoint =
      'https://giacomodebidda.com/.well-known/oauth-authorization-server'

    const { error, value: metadata } = await serverMetadata(metadata_endpoint)

    assert.ok(!error)
    assert.ok(metadata.authorization_endpoint)
    assert.ok(metadata.token_endpoint)
    assert.ok(metadata.introspection_endpoint)
    assert.ok(metadata.issuer)
    assert.ok(metadata.scopes_supported)
  })
})
