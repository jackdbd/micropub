import { describe, it } from 'node:test'
import assert from 'node:assert'
import { defValidateMf2Functions } from './test_utils.js'

const { validateH_event } = defValidateMf2Functions()

describe('h_event', () => {
  it('can be an empty objects, since all properties are optional', () => {
    const valid = validateH_event({})
    assert(valid)
    assert(validateH_event.errors === null)
  })

  it('can be an event that has start, end, location, name, summary', () => {
    const valid = validateH_event({
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00-07:00',
      end: '2013-06-30 18:00:00-07:00',
      location: 'Some bar in SF',
      summary: 'Get together and discuss all things microformats-related.'
    })
    assert(valid)
    assert(validateH_event.errors === null)
  })
})
