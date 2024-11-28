import { Static, Type } from '@sinclair/typebox'
import { latitude, longitude } from './geo.js'
import { h_geo } from './h-geo.js'

/**
 * microformats2 h-adr.
 *
 * All properties are optional. See:
 * - https://microformats.org/wiki/h-adr
 * - https://indieweb.org/h-adr
 */
export const h_adr = Type.Object(
  {
    /**
     * decimal altitude
     */
    altitude: Type.Optional(Type.Number()),

    'country-name': Type.Optional(Type.String()),

    /**
     * additional street details
     */
    'extended-address': Type.Optional(Type.String()),

    /**
     * (or u-geo with a RFC 5870 geo: URL), optionally embedded h-geo
     */
    geo: Type.Optional(Type.Ref(h_geo)),
    // Note: If we do the following...
    // geo: Type.Optional(h_geo)
    // ...we get:
    // Error: reference "h-geo" resolves to more than one schema

    /**
     * a mailing label, plain text, perhaps with preformatting
     */
    label: Type.Optional(Type.String()),

    /**
     * decimal latitude
     */
    latitude: Type.Optional(latitude),

    /**
     * city/town/village
     */
    locality: Type.Optional(Type.String()),

    /**
     * decimal longitude
     */
    longitude: Type.Optional(longitude),

    /**
     * post office mailbox
     */
    'post-office-box': Type.Optional(Type.String()),

    /**
     * postal code, e.g. ZIP in the US
     */
    'postal-code': Type.Optional(Type.String()),

    /**
     * state/county/province
     */
    region: Type.Optional(Type.String()),

    /**
     * house/apartment number, floor, street name
     */
    'street-address': Type.Optional(Type.String())
  },
  {
    $id: 'h-adr',
    title: 'microformats2 h-adr',
    description:
      'h-adr is a simple, open format for publishing structured locations such as addresses, physical and/or postal.',
    examples: [
      {
        'street-address': '17 Austerstræti',
        locality: 'Reykjavík',
        'country-name': 'Iceland',
        'postal-code': '107'
      }
    ]
  }
)

export type H_adr = Static<typeof h_adr>
