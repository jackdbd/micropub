import { Static, Type } from '@sinclair/typebox'
import { p_altitude } from './p-altitude.js'
import { p_latitude } from './p-latitude.js'
import { p_geo } from './p-geo.js'
import { p_longitude } from './p-longitude.js'
import { h_geo } from './h-geo.js'

/**
 * microformats2 h-adr.
 *
 * All properties are optional.
 *
 * @see https://microformats.org/wiki/h-adr
 * @see https://indieweb.org/h-adr
 */
export const h_adr = Type.Object(
  {
    altitude: Type.Optional(Type.Ref(p_altitude)),

    'country-name': Type.Optional(Type.String()),

    /**
     * additional street details
     */
    'extended-address': Type.Optional(Type.String()),

    /**
     * (or u-geo with a RFC 5870 geo: URL), optionally embedded h-geo
     */
    geo: Type.Optional(Type.Union([Type.Ref(p_geo), Type.Ref(h_geo)])),

    /**
     * a mailing label, plain text, perhaps with preformatting
     */
    label: Type.Optional(Type.String()),

    /**
     * decimal latitude
     */
    latitude: Type.Optional(Type.Ref(p_latitude)),

    /**
     * city/town/village
     */
    locality: Type.Optional(Type.String()),

    /**
     * decimal longitude
     */
    longitude: Type.Optional(Type.Ref(p_longitude)),

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
        altitude: 43,
        'country-name': 'Iceland',
        latitude: 64.128288,
        locality: 'Reykjavík',
        longitude: -21.827774,
        'postal-code': '107',
        'street-address': '17 Austerstræti'
      },
      {
        geo: {
          latitude: 64.128288,
          locality: 'Reykjavík',
          longitude: -21.827774
        }
      },
      {
        geo: 'geo:37.786971,-122.399677;u=35'
      }
    ]
  }
)

export type H_Adr = Static<typeof h_adr>
