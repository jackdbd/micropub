import { type Static, Type } from '@sinclair/typebox'
import { h_card } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_card = Type.Object(
  {
    ...h_card.properties,

    h: Type.Literal('card'),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    type: Type.Optional(Type.Literal('card'))
  },
  { $id: 'micropub-card', title: 'Micropub h=card' }
)

export type MP_card = Static<typeof mp_card>
