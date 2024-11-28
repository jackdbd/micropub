import { describe, it } from 'node:test'
import assert from 'node:assert'
import { jf2ToContentWithFrontmatter } from '../dist/lib/micropub/index.js'

describe('jf2ToContentWithFrontmatter', () => {
  it('strips away access_token and type', () => {
    const jf2 = {
      access_token: 'ey...xyz',
      h: 'entry',
      content: 'Hello world',
      category: ['foo', 'bar']
    }

    const str = jf2ToContentWithFrontmatter(jf2)

    assert.ok(str.includes(jf2.content))
    assert.ok(str.includes(jf2.category[0]))
    assert.ok(str.includes(jf2.category[1]))

    assert.ok(!str.includes(jf2.access_token))
    assert.ok(!str.includes(jf2.h))
  })

  it('returns content as plain text', () => {
    const jf2 = { content: 'Hello world' }

    const str = jf2ToContentWithFrontmatter(jf2)
    const lines = str.split('\n')

    assert.ok(str.includes(jf2.content))

    assert.equal(lines[0], jf2.content)
  })

  it('returns content as HTML with no frontmatter', () => {
    const jf2 = { content: { html: '<p>Hello world</p>' } }

    const str = jf2ToContentWithFrontmatter(jf2)

    assert.ok(str.includes(jf2.content.html))

    assert.equal(str, jf2.content.html)
  })

  it('returns content as HTML with frontmatter', () => {
    const jf2 = {
      'bookmark-of': 'https://mxb.dev/blog/the-indieweb-for-everyone/',
      content: { html: '<p>You should read this article!</p>' }
    }

    const str = jf2ToContentWithFrontmatter(jf2)
    const lines = str.split('\n')

    assert.ok(str.includes(jf2.content.html))

    assert.equal(lines[0], '---')
    assert.equal(lines[1], `bookmark-of: ${jf2['bookmark-of']}`)
    assert.equal(lines[2], '---')
    assert.equal(lines[3], '')
    assert.equal(lines[4], jf2.content.html)
  })
})
