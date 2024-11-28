import { Static, Type } from '@sinclair/typebox'
import { photo } from './photo.js'

/**
 * microformats2 h-item.
 *
 * All properties are optional. See:
 * - https://microformats.org/wiki/h-item
 * - https://indieweb.org/h-item
 */
export const h_item = Type.Object(
  {
    name: Type.Optional(Type.String()),

    photo: Type.Optional(photo),

    type: Type.Literal('item'),

    url: Type.Optional(Type.String({ format: 'uri' }))
  },
  {
    $id: 'h-item',
    title: 'microformats2 h-item',
    description:
      'h-item is a simple, open format for publishing details about arbitrary items.',
    examples: [
      {
        name: 'The Item Name',
        photo: {
          alt: 'Alternate text for the photo',
          url: 'http://example.org/items/1/photo.png'
        },
        url: 'http://example.org/items/1'
      }
    ]
  }
)

export type H_item = Static<typeof h_item>
