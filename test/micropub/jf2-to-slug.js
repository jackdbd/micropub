import { describe, it } from 'node:test'
import assert from 'node:assert'
import { jf2ToSlug } from '../../dist/lib/micropub/index.js'
import {
  isBookmark,
  isLike,
  isNote,
  isRepost,
  isRsvp
} from '../../dist/lib/jf2-predicates.js'

describe('jf2ToSlug', () => {
  it('uses `content` in a plain text note', () => {
    const jf2 = {
      h: 'entry',
      content: 'A plain text note.'
    }
    assert.ok(isNote(jf2))

    const slug = jf2ToSlug(jf2)

    assert.strictEqual(slug, 'a-plain-text-note')
  })

  it('uses `bookmark-of` in a bookmark', () => {
    const jf2 = {
      h: 'entry',
      'bookmark-of': 'http://example.com/articles/xyz/'
    }
    assert.ok(isBookmark(jf2))

    const slug = jf2ToSlug(jf2)

    assert.strictEqual(slug, 'example-com-articles-xyz')
  })

  it('uses `like-of` in a like', () => {
    const jf2 = {
      h: 'entry',
      'like-of': 'http://example.com/articles/xyz/'
    }
    assert.ok(isLike(jf2))

    const slug = jf2ToSlug(jf2)

    assert.strictEqual(slug, 'example-com-articles-xyz')
  })

  it('uses `in-reply-to` in a RSVP', () => {
    const jf2 = {
      h: 'entry',
      'in-reply-to': 'http://example.com/events/xyz/',
      content: 'Awesome party.',
      rsvp: 'interested'
    }
    assert.ok(isRsvp(jf2))

    const slug = jf2ToSlug(jf2)

    assert.strictEqual(slug, 'example-com-events-xyz')
  })

  it('uses `repost-of` in a repost', () => {
    const jf2 = {
      h: 'entry',
      'repost-of': 'http://example.com/articles/xyz/'
    }
    assert.ok(isRepost(jf2))

    const slug = jf2ToSlug(jf2)

    assert.strictEqual(slug, 'example-com-articles-xyz')
  })
})
