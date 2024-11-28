import { type Static, Type } from '@sinclair/typebox'
import { h_cite } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_cite = Type.Object(
  {
    ...h_cite.properties,

    h: Type.Literal('cite'),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    type: Type.Optional(Type.Literal('cite'))
  },
  { $id: 'micropub-cite', title: 'Micropub h=cite' }
)

export type MP_cite = Static<typeof mp_cite>
