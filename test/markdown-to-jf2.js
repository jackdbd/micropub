import { describe, it } from 'node:test'
import assert from 'node:assert'
import { markdownToJf2 } from '../dist/lib/markdown-to-jf2.js'

describe('markdownToJf2', () => {
  it('parses the frontmatter correctly', () => {
    const bookmark_of = 'https://mxb.dev/blog/the-indieweb-for-everyone/'
    const lines = [
      '---',
      `bookmark-of: ${bookmark_of}`,
      `category:`,
      '- awesome',
      '- indieweb',
      '---',
      '',
      'Hello **world**'
    ]
    const md = lines.join('\n')

    const jf2 = markdownToJf2(md)

    assert.equal(jf2.content.text, 'Hello world')
    assert.equal(jf2.content.html, '<p>Hello <strong>world</strong></p>')
    assert.ok(jf2.category.includes('awesome'))
    assert.ok(jf2.category.includes('indieweb'))
  })
})
