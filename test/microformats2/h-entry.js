import { describe, it } from 'node:test'
import assert from 'node:assert'
import { defValidateMf2Functions } from './test_utils.js'

const { validateH_entry } = defValidateMf2Functions()

describe('h_entry', () => {
  it('can be an empty objects, since all properties are optional', () => {
    const valid = validateH_entry({})
    assert(valid)
    assert(validateH_entry.errors === null)
  })

  it('can be a like-of', () => {
    const valid = validateH_entry({
      'like-of': 'http://othersite.example.com/permalink47'
    })
    assert(valid)
    assert(validateH_entry.errors === null)
  })

  it('can be a repost-of', () => {
    const valid = validateH_entry({
      'repost-of': 'https://example.com/post'
    })
    assert(valid)
    assert(validateH_entry.errors === null)
  })

  it('can be a note that has both plain text and html', () => {
    const valid = validateH_entry({
      content: {
        text: 'this is a note',
        html: '<p>This <b>is</b> a note</p>'
      },
      published: '1985-04-12T23:20:50.52Z'
    })
    assert(valid)
    assert(validateH_entry.errors === null)
  })
})
