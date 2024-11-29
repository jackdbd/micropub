import { type Static, Type } from '@sinclair/typebox'
import { h_cite } from '../../microformats2/index.js'
import { mp_slug, mp_syndicate_to } from './micropub-reserved-properties.js'

export const mp_cite = Type.Object(
  {
    ...h_cite.properties,

    h: Type.Literal('cite'),

    'mp-slug': Type.Optional(Type.Ref(mp_slug)),
    'mp-syndicate-to': Type.Optional(Type.Ref(mp_syndicate_to)),

    // Since in Micropub we use `h` to indicate the type of the object, we don't
    // need `type` to be present. But if it is, it must be 'cite'.
    type: Type.Optional(Type.Literal('cite'))
  },
  { $id: 'micropub-cite', title: 'Micropub h=cite' }
)

export type MP_Cite = Static<typeof mp_cite>
