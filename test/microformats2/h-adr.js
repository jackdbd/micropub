import { describe, it } from 'node:test'
import assert from 'node:assert'
import { defValidateMf2Functions } from './test_utils.js'

const { validateH_adr } = defValidateMf2Functions()

describe('h_adr', () => {
  it('can be an empty objects, since all properties are optional', () => {
    const valid = validateH_adr({})
    assert(valid)
    assert(validateH_adr.errors === null)
  })

  it('can have altitude, latitude, longitude', () => {
    const valid = validateH_adr({
      altitude: 100,
      longitude: -43,
      longitude: 55
    })
    assert(valid)
    assert(validateH_adr.errors === null)
  })

  it('can be an address', () => {
    const valid = validateH_adr({
      'street-address': '17 Austerstræti',
      locality: 'Reykjavík',
      'country-name': 'Iceland',
      'postal-code': '107'
    })
    assert(valid)
    assert(validateH_adr.errors === null)
  })
})
