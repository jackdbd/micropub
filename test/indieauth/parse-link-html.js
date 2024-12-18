import { describe, it } from 'node:test'
import assert from 'node:assert'
import { htmlToLinkHref } from '../../dist/lib/indieauth/index.js'

describe('htmlToLinkHref', () => {
  it('errors out when passed an empty string', () => {
    const { error, value } = htmlToLinkHref('')

    assert.ok(error)
    assert.ok(!value)
  })

  it('errors out when passed an invalid string', () => {
    const { error, value } = htmlToLinkHref('not HTML')

    assert.ok(error)
    assert.ok(!value)
  })

  it('returns the expected URL when the HTML has a <link rel="indieauth-metadata"> element', () => {
    const href =
      'https://giacomodebidda.com/.well-known/oauth-authorization-server'

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Test page</title>
      <link rel="indieauth-metadata" href="${href}">
    </head>
    <body>
      <h1>Hello</h1>
      <p>world</p>
    </body>
    `

    const { error, value } = htmlToLinkHref(html)

    assert.ok(!error)
    assert.strictEqual(value, href)
  })
})
