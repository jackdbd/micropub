import { Static, Type } from '@sinclair/typebox'
import { altitude, latitude, longitude } from './base.js'

/**
 * microformats2 h-geo.
 *
 * All properties are optional. See:
 * - https://microformats.org/wiki/h-geo
 * - https://indieweb.org/h-geo
 */
export const h_geo = Type.Object(
  {
    altitude: Type.Optional(altitude),
    latitude: Type.Optional(latitude),
    longitude: Type.Optional(longitude)
  },
  {
    $id: 'h-geo',
    title: 'microformats2 h-geo',
    description:
      'h-geo is a simple, open format for publishing WGS84 geographic coordinates.'
  }
)

export type H_geo = Static<typeof h_geo>
