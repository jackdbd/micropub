import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { mp_entry } from '../src/lib/micropub/index.js'
// import {
//   micropub_get_request,
//   micropub_post_request
// } from '../src/plugins/micropub-endpoint/schemas.js'
import { defValidateJf2 } from '../src/plugins/micropub-endpoint/validate-jf2.js'
import { check, describe } from './utils.js'

// TODO: convert most of this stuff to tests for the microformats2 library

const main = async () => {
  describe(mp_entry)
  // describe(micropub_get_request)
  // describe(micropub_post_request)

  const ajv = addFormats(new Ajv({ allErrors: true }), [
    'date',
    'date-time',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'json-pointer',
    'regex',
    'relative-json-pointer',
    'time',
    'uri',
    'uri-reference',
    'uri-template',
    'uuid'
  ])

  const {
    validateMicropubCard,
    validateMicropubCite,
    validateMicropubEntry,
    validateMicropubEvent
  } = defValidateJf2(ajv)

  check(
    'note that has an HTML representation',
    {
      content: {
        text: 'note that has an HTML representation',
        html: '<p>note that has an HTML representation/p>'
      }
    },
    validateMicropubEntry
  )

  check(
    'note with published datetime',
    {
      content: 'note with published datetime',
      // https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
      // This represents 20 minutes and 50.52 seconds after the 23rd hour of
      // April 12th, 1985 in UTC.
      published: '1985-04-12T23:20:50.52Z'
    },
    validateMicropubEntry
  )

  check(
    'card (bare minimum)',
    { name: 'My Micropub card', h: 'card' },
    validateMicropubCard
  )

  check(
    'cite (bare minimum)',
    {
      name: 'Parallel Lives',
      author: 'Plutarch',
      h: 'cite'
    },
    validateMicropubCite
  )

  check(
    'cite with content and published',
    {
      content: 'veni, vidi, vici',
      name: 'Parallel Lives',
      author: 'Plutarch',
      published: '0100-01-31',
      h: 'cite'
    },
    validateMicropubCite
  )

  check(
    'like',
    {
      'like-of': 'http://othersite.example.com/permalink47'
    },
    validateMicropubEntry
  )

  check(
    'repost',
    {
      'repost-of': 'https://example.com/post'
    },
    validateMicropubEntry
  )

  check(
    'event (bare minimum)',
    { name: 'Some event', h: 'event' },
    validateMicropubEvent
  )

  check(
    'event',
    {
      name: 'Micropub Meetup',
      start: '2013-06-30 12:00:00',
      end: '2013-06-30 18:00:00',
      location: 'Some bar in SF',
      summary: 'Get together and discuss all things microformats-related.',
      h: 'event'
    },
    validateMicropubEvent
  )
}

main()
