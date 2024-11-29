import { describe, it } from 'node:test'
import assert from 'node:assert'
import { defValidateMf2Functions } from './test_utils.js'

const { validateMicropubEntry: validate } = defValidateMf2Functions()

describe('mp-entry', () => {
  it('can be an empty objects, since all properties are optional', () => {
    const valid = validate({})

    assert(valid)
    assert(validate.errors === null)
  })

  it('can have a plain test string for content', () => {
    const valid = validate({ content: 'Hello World' })

    assert(valid)
    assert(validate.errors === null)
  })

  it('can be a repost with HTML content', () => {
    const valid = validate({
      'repost-of': 'http://othersite.example.com/permalink47',
      content: {
        html: '<p>You should read this <strong>awesome</strong> article</p>'
      }
    })

    assert(valid)
    assert(validate.errors === null)
  })

  it('can be a note with a photo (URL)', () => {
    const valid = validate({
      content: 'hello world',
      category: ['foo', 'bar'],
      photo: 'https://photos.example.com/592829482876343254.jpg'
    })

    assert(valid)
    assert(validate.errors === null)
  })

  it('can be a note with a photo (URL + alt text)', () => {
    const valid = validate({
      content: 'hello world',
      category: ['foo', 'bar'],
      photo: {
        alt: 'A photo of something cool',
        value: 'https://photos.example.com/592829482876343254.jpg'
      }
    })

    assert(valid)
    assert(validate.errors === null)
  })

  it('can be an RSVP with two syndication targets', () => {
    const valid = validate({
      'in-reply-to':
        'https://aaronparecki.com/2014/09/13/7/indieweb-xoxo-breakfast',
      rsvp: 'maybe',
      'mp-syndicate-to': [
        'https://fosstodon.org/@jackdbd',
        'https://news.indieweb.org/en'
      ]
    })

    assert(valid)
    assert(validate.errors === null)
  })
})
