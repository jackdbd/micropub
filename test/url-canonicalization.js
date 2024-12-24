import { describe, it } from 'node:test'
import assert from 'node:assert'
import { canonicalUrl } from '../dist/lib/url-canonicalization/index.js'

describe('canonicalUrl', () => {
  it('adds a trailing slash', () => {
    // If a URL with no path component is ever encountered, it MUST be treated
    // as if it had the path /
    // https://indieauth.spec.indieweb.org/#url-canonicalization-p-1
    const url = canonicalUrl('https://example.com')
    assert.strictEqual(url, 'https://example.com/')
  })

  it('adds a path to a base URL', () => {
    const url = canonicalUrl('some-path', 'https://website.example')
    assert.strictEqual(url, 'https://website.example/some-path')
  })

  it('ignores the base URL if the path is already a URL by itself', () => {
    const url = canonicalUrl(
      'https://website.example/some-path',
      'https://website.example'
    )
    assert.strictEqual(url, 'https://website.example/some-path')
  })

  it('can handle a URL that has http://localhost and no path', () => {
    const url = canonicalUrl('http://localhost:3000')
    assert.strictEqual(url, 'http://localhost:3000/')
  })

  it('can handle a URL that has http://localhost and a path', () => {
    const url = canonicalUrl('foo', 'http://localhost:3000')
    assert.strictEqual(url, 'http://localhost:3000/foo')
  })
})
