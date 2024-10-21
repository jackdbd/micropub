import { ValidateFunction } from 'ajv'
import { TSchema } from '@sinclair/typebox'
import { h_geo } from '../src/plugins/micropub/microformats2/index.js'
import { geo_uri } from '../src/plugins/micropub/microformats2/base.js'
import {
  micropub_get_request,
  micropub_post_request
} from '../src/plugins/micropub/schemas.js'
import { compileSchemasAndGetValidateFunctions } from '../src/plugins/micropub/utils.js'

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

  const {
    // validateGeoURI,
    validateH_adr,
    validateH_card,
    validateH_cite,
    validateH_entry,
    validateH_event,
    validateH_geo,
    validateH_item,
    validateMicropubGetRequest,
    validateMicropubPostRequest
  } = compileSchemasAndGetValidateFunctions()

  check('bare minimum note', { content: 'this is a note' }, validateH_entry)

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
    validateH_entry
  )

  check('bare minimum card', { name: 'My card' }, validateH_card)

  check(
    'bare minimum cite',
    {
      name: 'Parallel Lives',
      author: 'Plutarch'
    },
    validateH_cite
  )

  check(
    'cite with content and published',
    {
      content: 'veni, vidi, vici',
      name: 'Parallel Lives',
      author: 'Plutarch',
      published: '0100-01-31'
    },
    validateH_cite
  )

  // https://indieweb.org/like
  check(
    'like',
    {
      'like-of': 'http://othersite.example.com/permalink47'
    },
    validateH_entry
  )

  // https://indieweb.org/repost
  check(
    'repost',
    {
      'repost-of': 'https://example.com/post'
    },
    validateH_entry
  )

  check('bare minimum event', { name: 'Some event' }, validateH_event)

  check(
    'event',
    {
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00',
      end: '2013-06-30 18:00:00',
      location: 'Some bar in SF',
      summary: 'Get together and discuss all things microformats-related.'
    },
    validateH_event
  )

  check('geo', { latitude: -89.99, longitude: 179.99 }, validateH_geo)

  // check('Geo URI with lat/long', 'geo:46.772673,-71.282945', validateGeoURI)
  // check(
  //   'Geo URI with lat/long and uncertainty',
  //   'geo:46.772673,-71.282945;u=35',
  //   validateGeoURI
  // )

  check(
    'adr',
    {
      'street-address': '17 Austerstræti',
      locality: 'Reykjavík',
      'country-name': 'Iceland',
      'postal-code': '107'
    },
    validateH_adr
  )

  check(
    'item',
    {
      name: 'The Item Name',
      photo: 'http://example.org/items/1/photo.png',
      url: 'http://example.org/items/1'
    },
    validateH_item
  )

  check(
    'micropub GET request',
    { query: { q: 'syndicate-to' } },
    validateMicropubGetRequest
  )

  check(
    'micropub POST request',
    { body: { 'like-of': 'http://othersite.example.com/permalink47' } },
    validateMicropubPostRequest
  )
}

main()
