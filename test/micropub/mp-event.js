import { describe, it } from 'node:test'
import assert from 'node:assert'
import { defValidateMf2Functions } from './test_utils.js'

const { validateMicropubEvent: validate } = defValidateMf2Functions()

describe('mp-event', () => {
  it('can have start/end, location, a suggested slug and two syndication targets', () => {
    const valid = validate({
      h: 'event',
      location: 'Some bar in SF',
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00-07:00',
      end: '2013-06-30 18:00:00-07:00',
      summary: 'Get together and discuss all things microformats-related.',
      'mp-slug': 'microformats-meetup-in-sf',
      'mp-syndicate-to': [
        'https://fosstodon.org/@jackdbd',
        'https://news.indieweb.org/en'
      ]
    })

    assert(valid)
    assert(validate.errors === null)
  })
})
