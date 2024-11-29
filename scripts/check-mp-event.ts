import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  dt_duration,
  dt_end,
  dt_start,
  e_content,
  h_adr,
  h_geo,
  p_altitude,
  p_category,
  p_content,
  p_description,
  p_geo,
  p_latitude,
  p_location,
  p_longitude,
  p_name,
  p_summary,
  u_url
} from '../src/lib/microformats2/index.js'
import {
  mp_event,
  mp_slug,
  mp_syndicate_to
} from '../src/lib/micropub/index.js'
import { check } from './utils.js'

// https://ajv.js.org/packages/ajv-formats.html#formats
const ajv = addFormats(new Ajv({ allErrors: true }), [
  'date',
  'date-time',
  'duration',
  'uri'
])

const main = () => {
  ajv.compile(dt_duration)
  ajv.compile(dt_end)
  ajv.compile(dt_start)
  ajv.compile(e_content)
  ajv.compile(p_altitude)
  ajv.compile(p_category)
  ajv.compile(p_content)
  ajv.compile(p_description)
  ajv.compile(p_geo)
  ajv.compile(p_latitude)
  ajv.compile(p_location)
  ajv.compile(p_longitude)
  ajv.compile(p_name)
  ajv.compile(p_summary)
  ajv.compile(u_url)
  ajv.compile(h_geo)
  ajv.compile(h_adr)

  ajv.compile(mp_slug)
  ajv.compile(mp_syndicate_to)

  const validate = ajv.compile(mp_event)

  check('mp-event (bare minimum)', { h: 'event' }, validate)

  check(
    'mp-event with start/end, location, a suggested slug and two syndication targets',
    {
      h: 'event',
      location: 'Some bar in SF',
      name: 'Microformats Meetup',
      start: '2013-06-30 12:00:00-07:00',
      end: '2013-06-30 18:00:00-07:00',
      summary: 'Get together and discuss all things microformats-related.',
      'mp-slug': 'microformats-meetup-in-sf',
      'mp-syndicate-to': [
        'https://fosstodon.org/@jackdbd',
        'https://news.indieweb.org/en'
      ]
    },
    validate
  )
}

main()
