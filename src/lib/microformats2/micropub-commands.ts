/**
 * Properties beginning with mp- are reserved as a mechanism for Micropub
 * clients to give commands to Micropub servers.
 *
 * Clients and servers wishing to experiment with creating new mp- commands are
 * encouraged to brainstorm and document implementations at indieweb.org/Micropub-extensions.
 *
 * @see https://micropub.spec.indieweb.org/#reserved-properties
 * @see https://indieweb.org/Micropub-extensions
 */

import { Type } from '@sinclair/typebox'

export const mp_slug = Type.String()

const mp_syndicate_to_item = Type.String({ description: 'syndication target' })

export const mp_syndicate_to = Type.Union([
  mp_syndicate_to_item,
  Type.Array(mp_syndicate_to_item)
])
