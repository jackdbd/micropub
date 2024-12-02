import Ajv from 'ajv'
import {
  dt_accessed,
  dt_duration,
  dt_end,
  dt_published,
  dt_start,
  dt_updated,
  e_content,
  p_altitude,
  p_author,
  p_description,
  p_geo,
  p_latitude,
  p_location,
  p_longitude,
  p_publication,
  p_rsvp,
  p_summary,
  u_url,
  u_syndication,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_event,
  h_geo,
  h_item
} from '../../lib/microformats2/index.js'
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
} from '../../lib/micropub/index.js'
import {
  access_token,
  action
} from '../../lib/micropub/jf2/micropub-reserved-properties.js'

/**
 * Compile all schemas and return validate functions.
 *
 * Do NOT change the order in which these Ajv schemas are compiled!
 * Some Ajv schemas reference other ones, so they must be compiled in this
 * precise order.
 */
export const defValidateJf2 = (ajv: Ajv) => {
  // const label = '=== Compile schemas for microformats2 JF2 and Micropub JF2 ==='
  // console.time(label)

  ajv.compile(dt_accessed)
  ajv.compile(dt_duration)
  ajv.compile(dt_end)
  ajv.compile(dt_published)
  ajv.compile(dt_start)
  ajv.compile(dt_updated)

  ajv.compile(e_content)

  ajv.compile(p_altitude)
  ajv.compile(p_author)
  ajv.compile(p_description)
  ajv.compile(p_latitude)
  ajv.compile(p_location)
  ajv.compile(p_longitude)
  ajv.compile(p_publication)
  ajv.compile(p_rsvp)
  ajv.compile(p_summary)

  ajv.compile(u_url)
  ajv.compile(u_syndication)

  const validateGeoURI = ajv.compile(p_geo)
  const validateGeo = ajv.compile(h_geo)
  const validateAdr = ajv.compile(h_adr)

  const validateCard = ajv.compile(h_card)
  const validateCite = ajv.compile(h_cite)
  const validateEntry = ajv.compile(h_entry)
  const validateEvent = ajv.compile(h_event)
  const validateItem = ajv.compile(h_item)

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

  // console.timeLog(label)
  // console.timeEnd(label)

  return {
    validateAdr,
    validateCard,
    validateCite,
    validateEntry,
    validateEvent,
    validateGeo,
    validateGeoURI,
    validateItem,
    validateMicropubCard,
    validateMicropubCite,
    validateMicropubEntry,
    validateMicropubEvent
  }
}
