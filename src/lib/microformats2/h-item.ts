import { Static, Type } from '@sinclair/typebox'
import { p_name } from './p-name.js'
import { u_photo } from './u-photo.js'
import { u_url } from './u-url.js'

/**
 * microformats2 h-item.
 *
 * All properties are optional.
 *
 * @see https://microformats.org/wiki/h-item
 * @see https://indieweb.org/h-item
 */
export const h_item = Type.Object(
  {
    name: Type.Optional(Type.Ref(p_name)),
    photo: Type.Optional(Type.Ref(u_photo)),
    type: Type.Literal('item'),
    url: Type.Optional(Type.Ref(u_url))
  },
  {
    $id: 'h-item',
    title: 'microformats2 h-item',
    description:
      'h-item is a simple, open format for publishing details about arbitrary items.',
    examples: [
      {
        name: 'The Item Name',
        photo: 'http://example.org/items/1/photo.png',
        url: 'http://example.org/items/1'
      }
    ]
  }
)

export type H_Item = Static<typeof h_item>
