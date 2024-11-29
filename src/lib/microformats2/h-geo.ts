import { Static, Type } from '@sinclair/typebox'
import { p_altitude } from './p-altitude.js'
import { p_latitude } from './p-latitude.js'
import { p_longitude } from './p-longitude.js'

/**
 * microformats2 h-geo.
 *
 * All properties are optional.
 *
 * @see https://microformats.org/wiki/h-geo
 * @see https://indieweb.org/h-geo
 */
export const h_geo = Type.Object(
  {
    altitude: Type.Optional(Type.Ref(p_altitude)),
    latitude: Type.Optional(Type.Ref(p_latitude)),
    longitude: Type.Optional(Type.Ref(p_longitude))
  },
  {
    $id: 'h-geo',
    title: 'microformats2 h-geo',
    description:
      'h-geo is a simple, open format for publishing WGS84 geographic coordinates.'
  }
)

export type H_Geo = Static<typeof h_geo>
