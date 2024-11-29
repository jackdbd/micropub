import { type Static, Type } from '@sinclair/typebox'
import { h_event } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_event = Type.Object(
  {
    ...h_event.properties,

    h: Type.Literal('event'),

    'mp-slug': Type.Optional(Type.Ref(mp_slug)),
    'mp-syndicate-to': Type.Optional(Type.Ref(mp_syndicate_to)),

    // Since in Micropub we use `h` to indicate the type of the object, we don't
    // need `type` to be present. But if it is, it must be 'event'.
    type: Type.Optional(Type.Literal('event'))
  },
  {
    $id: 'micropub-event',
    title: 'Micropub h=event',
    examples: [
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
      }
    ]
  }
)

export type MP_Event = Static<typeof mp_event>
