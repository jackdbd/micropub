import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  p_altitude,
  p_latitude,
  p_longitude
} from '../../dist/lib/microformats2/index.js'
import { defValidateMf2Functions } from './test_utils.js'

const { validateAltitude, validateGeoURI } = defValidateMf2Functions()

describe('altitude', () => {
  it('has expected $id', () => {
    assert.strictEqual(p_altitude.$id, 'p-altitude')
  })

  it('can be a negative number', () => {
    const valid = validateAltitude(-100)
    assert(valid)
  })
})

describe('latitude', () => {
  it('has expected $id', () => {
    assert.strictEqual(p_latitude.$id, 'p-latitude')
  })
})

describe('longitude', async () => {
  it('has expected $id', () => {
    assert.strictEqual(p_longitude.$id, 'p-longitude')
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
