import Ajv from 'ajv'
import type { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { TSchema } from '@sinclair/typebox'
import { geo_uri, h_geo } from '../src/lib/microformats2/index.js'
import {
  micropub_get_request,
  micropub_post_request
} from '../src/plugins/micropub-endpoint/schemas.js'
import { defValidateJf2 } from '../src/plugins/micropub-endpoint/validate-jf2.js'

// TODO: convert most of this stuff to tests for the microformats2 library

const check = (what: string, value: any, validate: ValidateFunction) => {
  const valid = validate(value)
  console.log(`is '${what}' valid?`, valid)

  if (validate.errors) {
    validate.errors.forEach((error, i) => {
      console.log(`validation error ${i + 1} in '${what}'`, error)
    })
  }
}

const describe = (schema: TSchema) => {
  console.log(`=== JSON schema '${schema.title}' ($id: ${schema.$id}) ===`)
  console.log(schema)
  console.log('\n')
}

const main = async () => {
  // describe(h_adr)
  // describe(h_card)
  // describe(h_entry)
  // describe(h_event)
  describe(h_geo)
  // describe(h_item)
  describe(micropub_get_request)
  describe(micropub_post_request)
  describe(geo_uri)

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
    validateGeoURI,
    validateAdr,
    validateCard,
    validateCite,
    validateEntry,
    validateEvent,
    validateGeo,
    validateItem
  } = defValidateJf2(ajv)

  check('bare minimum note', { content: 'this is a note' }, validateEntry)

  check(
    'html note with published datetime',
    {
      content: {
        value: 'this is a note',
        html: '<p>This <b>is</b> a note</p>'
      },
      // https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
      // This represents 20 minutes and 50.52 seconds after the 23rd hour of
      // April 12th, 1985 in UTC.
      published: '1985-04-12T23:20:50.52Z'
    },
    validateEntry
  )

  check('bare minimum card', { name: 'My card' }, validateCard)

  check(
    'bare minimum cite',
    {
      name: 'Parallel Lives',
      author: 'Plutarch'
    },
    validateCite
  )

  check(
    'cite with content and published',
    {
      content: 'veni, vidi, vici',
      name: 'Parallel Lives',
      author: 'Plutarch',
      published: '0100-01-31'
    },
    validateCite
  )

  // https://indieweb.org/like
  check(
    'like',
    {
      'like-of': 'http://othersite.example.com/permalink47'
    },
    validateEntry
  )

  // https://indieweb.org/repost
  check(
    'repost',
    {
      'repost-of': 'https://example.com/post'
    },
    validateEntry
  )

  check('bare minimum event', { name: 'Some event' }, validateEvent)

  check(
    'event',
    {
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00',
      end: '2013-06-30 18:00:00',
      location: 'Some bar in SF',
      summary: 'Get together and discuss all things microformats-related.'
    },
    validateEvent
  )

  check('geo', { latitude: -89.99, longitude: 179.99 }, validateGeo)

  check('Geo URI with lat/long', 'geo:46.772673,-71.282945', validateGeoURI)
  check(
    'Geo URI with lat/long and uncertainty',
    'geo:46.772673,-71.282945;u=35',
    validateGeoURI
  )

  check(
    'adr',
    {
      'street-address': '17 Austerstræti',
      locality: 'Reykjavík',
      'country-name': 'Iceland',
      'postal-code': '107'
    },
    validateAdr
  )

  check(
    'item',
    {
      name: 'The Item Name',
      photo: 'http://example.org/items/1/photo.png',
      url: 'http://example.org/items/1'
    },
    validateItem
  )
}

main()
