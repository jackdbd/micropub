import { type Static, Type } from '@sinclair/typebox'
import { h_entry } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_entry = Type.Object(
  {
    ...h_entry.properties,

    h: Type.Optional(Type.Literal('entry', { default: 'entry' })),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    type: Type.Optional(Type.Literal('entry'))
  },
  { $id: 'micropub-entry', title: 'Micropub h=entry' }
)

export type MP_entry = Static<typeof mp_entry>
