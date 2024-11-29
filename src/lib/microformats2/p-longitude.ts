import { Static, Type } from '@sinclair/typebox'

// For more information refer to the WGS84 specification and the geo URI scheme.
export const p_longitude = Type.Number({
  $id: 'p-longitude',
  description: `Coordinate that specifies the east–west position of a point on the surface of the Earth, in decimal degrees.`,
  title: 'Longitude',
  minimum: -180,
  maximum: 180
})

export type P_Longitude = Static<typeof p_longitude>
