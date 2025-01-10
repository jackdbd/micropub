import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  h_geo,
  p_altitude,
  p_latitude,
  p_longitude
} from '../../src/lib/microformats2/index.js'
import { check } from '../utils.js'

// https://ajv.js.org/packages/ajv-formats.html#formats
const ajv = addFormats(new Ajv({ allErrors: true }), [])

const main = () => {
  ajv.compile(p_altitude)
  ajv.compile(p_latitude)
  ajv.compile(p_longitude)

  const validate = ajv.compile(h_geo)

  check('h-geo (bare minimum)', {}, validate)

  check(
    'h-geo with latitude and longitude',
    {
      latitude: 41.902782,
      longitude: 12.496366
    },
    validate
  )
}

main()
