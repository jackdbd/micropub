import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as mf2 from '../../dist/lib/microformats2/index.js'

export const defValidateMf2Functions = () => {
  const ajv = addFormats(new Ajv({ allErrors: true }), [
    'date',
    'date-time',
    'duration',
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

  ajv.compile(mf2.dt_accessed)
  ajv.compile(mf2.dt_duration)
  ajv.compile(mf2.dt_end)
  ajv.compile(mf2.dt_published)
  ajv.compile(mf2.dt_start)
  ajv.compile(mf2.dt_updated)

  ajv.compile(mf2.e_content)

  const validateAltitude = ajv.compile(mf2.p_altitude)
  ajv.compile(mf2.p_author)
  ajv.compile(mf2.p_description)
  const validateLatitude = ajv.compile(mf2.p_latitude)
  const validateLongitude = ajv.compile(mf2.p_longitude)
  const validateGeoURI = ajv.compile(mf2.p_geo)
  ajv.compile(mf2.p_location)
  ajv.compile(mf2.p_publication)
  ajv.compile(mf2.p_rsvp)
  ajv.compile(mf2.p_summary)

  ajv.compile(mf2.u_url)
  ajv.compile(mf2.u_syndication)

  const validateH_geo = ajv.compile(mf2.h_geo)
  const validateH_adr = ajv.compile(mf2.h_adr)

  const validateH_card = ajv.compile(mf2.h_card)
  const validateH_cite = ajv.compile(mf2.h_cite)
  const validateH_entry = ajv.compile(mf2.h_entry)
  const validateH_event = ajv.compile(mf2.h_event)
  const validateH_item = ajv.compile(mf2.h_item)

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
