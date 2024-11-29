import { Static, Type } from '@sinclair/typebox'

// For more information refer to the WGS84 specification and the geo URI scheme.
export const p_altitude = Type.Number({
  $id: 'p-altitude',
  description: `Distance in metres from the nominal sea level along the tangent of the earth’s curve, i.e. the geoid height.`,
  title: 'Altitude'
})

export type P_Altitude = Static<typeof p_altitude>
