import { type Static, Type } from '@sinclair/typebox'
import { dt_anniversary } from './dt-anniversary.js'
import { dt_bday } from './dt-bday.js'
import { p_altitude } from './p-altitude.js'
import { p_category } from './p-category.js'
import { p_content } from './p-content.js'
import { p_latitude } from './p-latitude.js'
import { p_longitude } from './p-longitude.js'
import { p_name } from './p-name.js'
import { u_photo } from './u-photo.js'
import { u_uid } from './u-uid.js'
import { u_url } from './u-url.js'
import { h_adr } from './h-adr.js'
import { h_geo } from './h-geo.js'

/**
 * microformats2 h-card.
 *
 * All properties are optional and may be plural.
 *
 * @see https://microformats.org/wiki/h-card
 * @see https://indieweb.org/h-card
 */
export const h_card = Type.Object(
  {
    'additional-name': Type.Optional(
      Type.String({ description: 'other (e.g. middle) name' })
    ),

    // postal address, optionally embed an h-adr
    adr: Type.Optional(Type.Union([Type.String(), Type.Ref(h_adr)])),

    altitude: Type.Optional(p_altitude),

    anniversary: Type.Optional(dt_anniversary),

    bday: Type.Optional(dt_bday),

    category: Type.Optional(p_category),

    content: Type.Optional(p_content),

    'country-name': Type.Optional(Type.String({ description: 'country name' })),

    email: Type.Optional(Type.String({ format: 'email' })),

    'extended-address': Type.Optional(
      Type.String({ description: 'apartment/suite/room name/number if any' })
    ),

    'family-name': Type.Optional(
      Type.String({ description: 'family (often last) name' })
    ),

    'gender-identity': Type.Optional(
      Type.String({ description: 'gender identity, new in vCard4 (RFC 6350)' })
    ),

    geo: Type.Optional(Type.Ref(h_geo)),

    'given-name': Type.Optional(
      Type.String({ description: 'given (often first) name' })
    ),

    'honorific-prefix': Type.Optional(
      Type.String({ examples: ['Mr.', 'Mrs.', 'Dr.'] })
    ),

    'honorific-suffix': Type.Optional(
      Type.String({ examples: ['Ph.D', 'Esq.'] })
    ),

    impp: Type.Optional(
      Type.String({ description: 'per RFC4770, new in vCard4 (RFC 6350)' })
    ),

    'job-title': Type.Optional(Type.String()),

    key: Type.Optional(
      Type.String({ description: 'cryptographic public key e.g. SSH or GPG' })
    ),

    label: Type.Optional(Type.String()),

    latitude: Type.Optional(p_latitude),

    locality: Type.Optional(Type.String({ description: 'city/town/village' })),

    logo: Type.Optional(
      Type.String({
        format: 'uri',
        description:
          'a logo representing the person or organization (e.g. a face icon)'
      })
    ),

    longitude: Type.Optional(p_longitude),

    name: Type.Optional(p_name),

    nickname: Type.Optional(
      Type.String({ description: 'nickname/alias/handle' })
    ),

    note: Type.Optional(Type.String({ description: 'additional notes' })),

    org: Type.Optional(Type.String()),
    // https://github.com/sinclairzx81/typebox#types-recursive
    // org: Type.Optional(Type.Union([Type.String(), Type.Ref(h_card)])),

    photo: Type.Optional(u_photo),

    'postal-code': Type.Optional(
      Type.String({ description: 'postal code, e.g. US ZIP' })
    ),

    'post-office-box': Type.Optional(
      Type.String({ description: 'post office box description if any' })
    ),

    region: Type.Optional(
      Type.String({ description: 'state/county/province' })
    ),

    role: Type.Optional(Type.String({ description: 'description of role' })),

    sex: Type.Optional(
      Type.String({ description: 'biological sex, new in vCard4 (RFC 6350)' })
    ),

    'sort-string': Type.Optional(
      Type.String({ description: 'string to sort by' })
    ),

    'street-address': Type.Optional(
      Type.String({ description: 'street number + name' })
    ),

    tel: Type.Optional(Type.String()),

    type: Type.Literal('card'),

    uid: Type.Optional(u_uid),

    url: Type.Optional(Type.Ref(u_url))
  },
  {
    $id: 'h-card',
    title: 'microformats2 h-card',
    description:
      'h-card is a simple, open format for publishing people and organisations on the web. h-card is often used on home pages and individual blog posts.'
  }
)

export type H_Card = Static<typeof h_card>
