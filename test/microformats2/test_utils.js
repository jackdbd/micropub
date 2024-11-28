import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  geo_uri,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_event,
  h_geo,
  h_item
} from '../../dist/lib/microformats2/index.js'
import {
  altitude,
  latitude,
  longitude
} from '../../dist/lib/microformats2/geo.js'

export const defValidateMf2Functions = () => {
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

  const validateAltitude = ajv.compile(altitude)
  const validateLatitude = ajv.compile(latitude)
  const validateLongitude = ajv.compile(longitude)
  const validateGeoURI = ajv.compile(geo_uri)
  const validateH_geo = ajv.compile(h_geo)
  const validateH_adr = ajv.compile(h_adr)
  const validateH_card = ajv.compile(h_card)
  const validateH_cite = ajv.compile(h_cite)
  const validateH_entry = ajv.compile(h_entry)
  const validateH_event = ajv.compile(h_event)
  const validateH_item = ajv.compile(h_item)

  return {
    ajv,
    validateAltitude,
    validateLatitude,
    validateLongitude,
    validateGeoURI,
    validateH_adr,
    validateH_card,
    validateH_cite,
    validateH_entry,
    validateH_event,
    validateH_geo,
    validateH_item
  }
}
