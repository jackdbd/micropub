import { Static, Type } from '@sinclair/typebox'

export const p_latitude = Type.Number({
  $id: 'p-latitude',
  minimum: -90,
  maximum: 90,
  title: 'Latitude',
  description: `Coordinate that specifies the north–south position of a point on the surface of the Earth, in decimal degrees.`
})

export type P_Latitude = Static<typeof p_latitude>
