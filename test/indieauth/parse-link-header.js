import { describe, it } from 'node:test'
import assert from 'node:assert'
import { linkHeaderToLinkHref } from '../../dist/lib/indieauth/index.js'

describe('linkHeaderToLinkHref', () => {
  it('errors out when passed an empty string', () => {
    const { error, value } = linkHeaderToLinkHref('')

    assert.ok(error)
    assert.ok(!value)
  })

  it('errors out when passed an invalid string', () => {
    const { error, value } = linkHeaderToLinkHref('foo')

    assert.ok(error)
    assert.ok(!value)
  })

  it('errors out when the Link header has no rel="indieauth-metadata" attribute', () => {
    const uri_reference =
      'https://giacomodebidda.com/.well-known/oauth-authorization-server'

    const { error, value } = linkHeaderToLinkHref(
      `<${uri_reference}>; param1=value1; param2="value2"`
    )

    assert.ok(error)
    assert.ok(!value)
  })

  it('errors out when the Link header has more than one rel="indieauth-metadata" attribute', () => {
    const uri_reference =
      'https://giacomodebidda.com/.well-known/oauth-authorization-server'

    const { error, value } = linkHeaderToLinkHref(
      `<${uri_reference}>; rel="indieauth-metadata", <${uri_reference}>; rel="indieauth-metadata"`
    )

    assert.ok(error)
    assert.ok(!value)
  })

  it('returns the expected URL when the Link header has a rel="indieauth-metadata" attribute', () => {
    const indieauth_uri_reference =
      'https://giacomodebidda.com/.well-known/oauth-authorization-server'

    const micropub_uri_reference = 'https://micropub.fly.dev/micropub'

    const { error, value } = linkHeaderToLinkHref(
      `<${indieauth_uri_reference}>; rel="indieauth-metadata", <${micropub_uri_reference}>; rel="micropub"`
    )

    assert.ok(!error)
    assert.strictEqual(value, indieauth_uri_reference)
  })
})
