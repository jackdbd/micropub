import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as mf2 from '../../dist/lib/microformats2/index.js'
import {
  date_time,
  mp_card,
  mp_cite,
  mp_entry,
  mp_event,
  mp_limit,
  mp_post_status,
  mp_slug,
  mp_syndicate_to,
  mp_visibility,
  photo
} from '../../dist/lib/micropub/index.js'
import {
  access_token,
  action
} from '../../dist/lib/micropub/jf2/micropub-reserved-properties.js'

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

  ajv.compile(access_token)
  ajv.compile(action)
  ajv.compile(mp_limit)
  ajv.compile(mp_post_status)
  ajv.compile(mp_slug)
  ajv.compile(mp_syndicate_to)
  ajv.compile(mp_visibility)
  ajv.compile(photo)
  ajv.compile(date_time)

  const validateMicropubCard = ajv.compile(mp_card)
  const validateMicropubCite = ajv.compile(mp_cite)
  const validateMicropubEntry = ajv.compile(mp_entry)
  const validateMicropubEvent = ajv.compile(mp_event)

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
    validateH_item,
    validateMicropubCard,
    validateMicropubCite,
    validateMicropubEntry,
    validateMicropubEvent
  }
}
