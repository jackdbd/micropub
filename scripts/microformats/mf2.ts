import { defValidateJf2 } from '../../src/plugins/micropub-endpoint/validate-jf2.js'
import { defAjv } from '../../src/ajv.js'
import { check } from '../utils.js'

// TODO: convert most of this stuff to tests for the microformats2 library

const main = async () => {
  const ajv = defAjv({ allErrors: true })

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

  check('plain text note', { content: 'plain text note' }, validateEntry)

  check(
    'note that has an HTML representation',
    {
      content: {
        text: 'note that has an HTML representation',
        html: '<p>note that has an HTML representation/p>'
      }
    },
    validateEntry
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
    validateEntry
  )

  check(
    'bare minimum JF2 card',
    { name: 'My JF2 card', type: 'card' },
    validateCard
  )

  check(
    'bare minimum JF2 cite',
    {
      name: 'Parallel Lives',
      author: 'Plutarch',
      type: 'cite'
    },
    validateCite
  )

  check(
    'bare minimum JF2 event',
    { name: 'Some event', type: 'event' },
    validateEvent
  )

  check(
    'JF2 event',
    {
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00',
      end: '2013-06-30 18:00:00',
      location: 'Some bar in SF',
      summary: 'Get together and discuss all things microformats-related.',
      type: 'event'
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
      url: 'http://example.org/items/1',
      type: 'item'
    },
    validateItem
  )
}

main()
