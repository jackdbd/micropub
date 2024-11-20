import { Static, Type } from '@sinclair/typebox'
import { h_adr } from './h-adr.js'
import { h_geo } from './h-geo.js'
import {
  altitude,
  latitude,
  longitude,
  photo,
  string_or_html_and_value
} from './base.js'

/**
 * microformats2 h-card.
 *
 * All properties are optional and may be plural. See:
 *
 * - https://microformats.org/wiki/h-card
 * - https://indieweb.org/h-card
 */
export const h_card = Type.Object(
  {
    'additional-name': Type.Optional(
      Type.String({ description: 'other (e.g. middle) name' })
    ),

    // postal address, optionally embed an h-adr
    adr: Type.Optional(Type.Union([Type.String(), Type.Ref(h_adr)])),

    altitude: Type.Optional(altitude),

    anniversary: Type.Optional(Type.String({ format: 'date' })),

    bday: Type.Optional(
      Type.String({ format: 'date', description: 'birth date' })
    ),

    category: Type.Optional(Type.String({ description: 'category/tag' })),

    content: Type.Optional(string_or_html_and_value),

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

    latitude: Type.Optional(latitude),

    locality: Type.Optional(Type.String({ description: 'city/town/village' })),

    logo: Type.Optional(
      Type.String({
        format: 'uri',
        description:
          'a logo representing the person or organization (e.g. a face icon)'
      })
    ),

    longitude: Type.Optional(longitude),

    name: Type.Optional(
      Type.String({
        description: 'The full/formatted name of the person or organization'
      })
    ),

    nickname: Type.Optional(
      Type.String({ description: 'nickname/alias/handle' })
    ),

    note: Type.Optional(Type.String({ description: 'additional notes' })),

    org: Type.Optional(Type.String()),
    // https://github.com/sinclairzx81/typebox#types-recursive
    // org: Type.Optional(Type.Union([Type.String(), Type.Ref(h_card)])),

    photo: Type.Optional(Type.Union([photo, Type.Array(photo)])),

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

    uid: Type.Optional(
      Type.String({
        format: 'uri',
        description: 'universally unique identifier, preferably canonical URL'
      })
    ),

    url: Type.Optional(
      Type.String({
        format: 'uri',
        description:
          'home page or other URL representing the person or organization'
      })
    )
  },
  {
    $id: 'h-card',
    title: 'microformats2 h-card',
    description:
      'h-card is a simple, open format for publishing people and organisations on the web. h-card is often used on home pages and individual blog posts.'
  }
)

export type H_card = Static<typeof h_card>
