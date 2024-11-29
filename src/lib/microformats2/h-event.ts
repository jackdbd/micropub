import { Static, Type } from '@sinclair/typebox'
import { dt_duration } from './dt-duration.js'
import { dt_end } from './dt-end.js'
import { dt_start } from './dt-start.js'
import { e_content } from './e-content.js'
import { p_category } from './p-category.js'
import { p_content } from './p-content.js'
import { p_description } from './p-description.js'
import { p_geo } from './p-geo.js'
import { p_location } from './p-location.js'
import { p_name } from './p-name.js'
import { p_summary } from './p-summary.js'
import { u_url } from './u-url.js'
import { h_adr } from './h-adr.js'

/**
 * microformats2 h-event.
 *
 * All properties are optional.
 *
 * @see https://microformats.org/wiki/h-event
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/microformats#h-event
 */
export const h_event = Type.Object(
  {
    category: Type.Optional(Type.Ref(p_category)),

    content: Type.Optional(
      Type.Union([Type.Ref(p_content), Type.Ref(e_content)])
    ),

    description: Type.Optional(Type.Ref(p_description)),

    duration: Type.Optional(Type.Ref(dt_duration)),

    end: Type.Optional(Type.Ref(dt_end)),

    location: Type.Optional(
      Type.Union(
        [
          Type.Ref(p_location),
          Type.Ref(p_geo),
          Type.Ref(u_url),
          Type.Ref(h_adr)
        ],
        {
          $id: 'event-location',
          title: 'location',
          description: 'Location of the event.'
        }
      )
    ),

    name: Type.Optional(Type.Ref(p_name)),

    start: Type.Optional(Type.Ref(dt_start)),

    summary: Type.Optional(Type.Ref(p_summary)),

    type: Type.Literal('event'),

    url: Type.Optional(Type.Ref(u_url))
  },
  {
    $id: 'h-event',
    title: 'microformats2 h-event',
    description:
      'h-event is the microformats2 vocabulary for marking up an event post on web sites. h-event is often used with both event listings and individual event pages.',
    examples: [
      {
        name: 'Microformats Meetup',
        start: '2013-06-30 12:00:00-07:00',

        // In order to allow a date format like the one below, I think we would
        // need a custom format for Ajv.
        // start: '30th June 2013, 12:00',

        end: '2013-06-30 18:00:00-07:00',
        location: 'Some bar in SF',
        summary: 'Get together and discuss all things microformats-related.'
      }
    ]
  }
)

export type H_Event = Static<typeof h_event>
