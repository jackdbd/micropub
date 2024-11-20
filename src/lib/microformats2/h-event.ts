import { Static, Type } from '@sinclair/typebox'
import { date_time, string_or_html_and_value } from './base.js'
import { h_adr } from './h-adr.js'
import { h_card } from './h-card.js'
import { h_geo } from './h-geo.js'
import { mp_slug, mp_syndicate_to } from './micropub-commands.js'

/**
 * microformats2 h-event.
 *
 * All properties are optional. See:
 * - https://microformats.org/wiki/h-event
 * - https://indieweb.org/h-event
 */
export const h_event = Type.Object(
  {
    /**
     * event category(ies)/tag(s)
     */
    category: Type.Optional(Type.String()),

    /**
     * full content of the event
     */
    content: Type.Optional(string_or_html_and_value),

    description: Type.Optional(
      Type.String({
        title: 'description',
        description: 'more detailed description of the event'
      })
    ),

    duration: Type.Optional(
      Type.Integer({ title: 'duration', description: 'duration of the event' })
    ),

    /**
     * datetime the event ends
     */
    end: Type.Optional(date_time),

    /**
     * where the event takes place, optionally embedded h-card, h-adr, or h-geo
     */
    location: Type.Optional(
      Type.Union(
        [Type.String(), Type.Ref(h_adr), Type.Ref(h_card), Type.Ref(h_geo)],
        { title: 'location', description: 'where the event takes place' }
      )
    ),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    name: Type.Optional(
      Type.String({ title: 'name', description: 'event name (or title)' })
    ),

    /**
     * datetime the event starts
     */
    start: Type.Optional(date_time),

    summary: Type.Optional(
      Type.String({
        title: 'summary',
        description: 'short summary of the event'
      })
    ),

    url: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'url',
        description: 'permalink for the event'
      })
    )
  },
  {
    $id: 'h-event',
    title: 'microformats2 h-event',
    description:
      'h-event is a simple, open format for events on the web. h-event is often used with both event listings and individual event pages.',
    examples: [
      {
        name: 'Microformats Meetup',
        start: '2013-06-30 12:00:00-07:00',
        end: '2013-06-30 18:00:00-07:00',
        location: 'Some bar in SF',
        summary: 'Get together and discuss all things microformats-related.'
      }
    ]
  }
)

export type H_event = Static<typeof h_event>
