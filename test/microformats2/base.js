import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import {
  altitude,
  latitude,
  longitude,
  date_time
} from '../../dist/lib/microformats2/base.js'
import { defValidateMf2Functions } from './test_utils.js'

const { ajv, validateAltitude, validateGeoURI } = defValidateMf2Functions()

describe('altitude', () => {
  before(() => {})

  it('has expected $id', () => {
    assert.strictEqual(altitude.$id, 'altitude')
  })

  it('can be a negative number', () => {
    const valid = validateAltitude(-100)
    assert(valid)
  })
})

describe('latitude', () => {
  it('has expected $id', () => {
    assert.strictEqual(latitude.$id, 'latitude')
  })
})

describe('longitude', async () => {
  it('has expected $id', () => {
    assert.strictEqual(longitude.$id, 'longitude')
  })
})

describe('geo-uri', async () => {
  it('is not any string', () => {
    const valid = validateGeoURI('foobar')
    assert(!valid)
    assert(validateGeoURI.errors.length > 0)
  })

  it('is a string defined in RFC 5870', () => {
    const valid = validateGeoURI('geo:37.786971,-122.399677;u=35')
    assert(valid)
  })
})

describe('date_time', () => {
  it('cannot be without a time zone', () => {
    const valid = ajv.validate(date_time, '2013-06-30 18:00:00')
    assert(!valid)
  })

  it('cannot be with a time zone notation', () => {
    const valid = ajv.validate(date_time, '2013-06-30T18:00:00 Europe/Rome')
    assert(!valid)
  })

  it('can be with an offset notation', () => {
    const valid = ajv.validate(date_time, '2013-06-30 18:00:00+02:00')
    assert(valid)
  })
})
