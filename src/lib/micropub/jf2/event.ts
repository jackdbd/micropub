import { type Static, Type } from '@sinclair/typebox'
import { h_event } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_event = Type.Object(
  {
    ...h_event.properties,

    h: Type.Literal('event'),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    type: Type.Optional(Type.Literal('event'))
  },
  { $id: 'micropub-event', title: 'Micropub h=event' }
)

export type MP_event = Static<typeof mp_event>
