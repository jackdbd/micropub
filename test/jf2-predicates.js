import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  isBookmark,
  isCheckin,
  isIssue,
  isLike,
  isNote,
  isRead,
  isReply,
  isRepost
} from '../dist/lib/jf2-predicates.js'

describe('isBookmark', () => {
  it('true if it has a `bookmark-of` property', () => {
    const jf2 = {
      h: 'entry',
      'bookmark-of': 'https://example.com/'
    }
    assert.ok(isBookmark(jf2))
  })
})

describe('isCheckin', () => {
  it('true if it has a `checkin` property', () => {
    const jf2 = {
      h: 'entry',
      checkin: 'geo:41.8902,12.4922;name=Colosseum'
    }
    assert.ok(isCheckin(jf2))
  })
})

describe('isIssue', () => {
  it('true if it has a `in-reply-to` property that is a repository hosted on GitHub', () => {
    const jf2 = {
      h: 'entry',
      'in-reply-to': 'https://github.com/jackdbd/zod-to-doc'
    }
    assert.ok(isIssue(jf2))
  })
})

describe('isLike', () => {
  it('true if it has a `like-of` property', () => {
    const jf2 = {
      h: 'entry',
      'like-of': 'https://example.com/'
    }
    assert.ok(isLike(jf2))
  })
})

describe('isNote', () => {
  it('true if it has `h=entry` and content is a string', () => {
    const jf2 = {
      h: 'entry',
      content: 'A note in plain text.'
    }
    assert.ok(isNote(jf2))
  })

  it('true if it has `h=entry` and content is an object with html and text', () => {
    const jf2 = {
      h: 'entry',
      content: {
        html: '<p>A simple <strong>note</strong>.</p>',
        text: 'A simple note.'
      }
    }
    assert.ok(isNote(jf2))
  })
})

describe('isRead', () => {
  it('true if it has a `read-of` property', () => {
    const jf2 = {
      h: 'entry',
      'read-of': 'https://example.com/'
    }
    assert.ok(isRead(jf2))
  })
})

describe('isReply', () => {
  it('true if it has a `in-reply-to` property', () => {
    const jf2 = {
      h: 'entry',
      'in-reply-to': 'https://example.com/'
    }
    assert.ok(isReply(jf2))
  })
})

describe('isRepost', () => {
  it('true if it has a `repost-of` property', () => {
    const jf2 = {
      h: 'entry',
      'repost-of': 'https://example.com/'
    }
    assert.ok(isRepost(jf2))
  })
})
