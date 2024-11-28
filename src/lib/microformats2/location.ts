import { type Static, Type } from '@sinclair/typebox'
import { h_adr } from './h-adr.js'
import { h_card } from './h-card.js'
import { h_geo } from './h-geo.js'

export const location = Type.Union(
  [Type.String(), Type.Ref(h_adr), Type.Ref(h_card), Type.Ref(h_geo)],
  { title: 'location' }
)

export type Location = Static<typeof location>
