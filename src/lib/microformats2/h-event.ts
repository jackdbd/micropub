import { Static, Type } from '@sinclair/typebox'
import { content } from './content.js'
import { category } from './category.js'
// import { date, date_time } from './date.js'
import { h_adr } from './h-adr.js'
import { h_card } from './h-card.js'
import { h_geo } from './h-geo.js'

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
    category: Type.Optional(category),

    /**
     * full content of the event
     */
    content: Type.Optional(content),

    description: Type.Optional(
      Type.String({
        title: 'description',
        description: 'more detailed description of the event'
      })
    ),

    duration: Type.Optional(
      Type.Integer({ title: 'duration', description: 'duration of the event' })
    ),

    // TODO: be more precise about the format and add links to the specs.
    // end: Type.Optional(Type.Union([date, date_time])),
    end: Type.Optional(Type.String()),

    /**
     * where the event takes place, optionally embedded h-card, h-adr, or h-geo
     */
    location: Type.Optional(
      Type.Union(
        [Type.String(), Type.Ref(h_adr), Type.Ref(h_card), Type.Ref(h_geo)],
        { title: 'location', description: 'where the event takes place' }
      )
    ),

    name: Type.Optional(
      Type.String({ title: 'name', description: 'event name (or title)' })
    ),

    // TODO: be more precise about the format and add links to the specs.
    // start: Type.Optional(Type.Union([date, date_time])),
    start: Type.Optional(Type.String()),

    summary: Type.Optional(
      Type.String({
        title: 'summary',
        description: 'short summary of the event'
      })
    ),

    type: Type.Literal('event'),

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
