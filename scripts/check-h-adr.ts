import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  h_adr,
  h_geo,
  p_altitude,
  p_geo,
  p_latitude,
  p_longitude
} from '../src/lib/microformats2/index.js'
import { check } from './utils.js'

// https://ajv.js.org/packages/ajv-formats.html#formats
const ajv = addFormats(new Ajv({ allErrors: true }), [])

const main = () => {
  ajv.compile(p_altitude)
  ajv.compile(p_geo)
  ajv.compile(p_latitude)
  ajv.compile(p_longitude)
  ajv.compile(h_geo)

  const validate = ajv.compile(h_adr)

  check('h-adr (bare minimum)', {}, validate)

  check(
    'h-adr with latitude, longitude, altitude',
    {
      altitude: 43,
      'country-name': 'Iceland',
      latitude: 64.128288,
      locality: 'Reykjavík',
      longitude: -21.827774,
      'postal-code': '107',
      'street-address': '17 Austerstræti'
    },
    validate
  )

  check(
    'h-adr with geo object',
    {
      geo: {
        latitude: 64.128288,
        locality: 'Reykjavík',
        longitude: -21.827774
      }
    },
    validate
  )

  check(
    'h-adr with geo URI',
    {
      geo: 'geo:37.786971,-122.399677;u=35'
    },
    validate
  )
}

main()
