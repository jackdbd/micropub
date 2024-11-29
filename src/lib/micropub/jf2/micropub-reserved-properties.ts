/**
 * Properties beginning with `mp-` are reserved as a mechanism for Micropub
 * clients to give commands to Micropub servers.
 *
 * Clients and servers wishing to experiment with creating new `mp-` commands
 * are encouraged to brainstorm and document implementations at
 * indieweb.org/Micropub-extensions.
 *
 * @see https://indieweb.org/Micropub#Examples_of_Creating_Objects
 * @see https://micropub.spec.indieweb.org/#reserved-properties
 * @see https://www.w3.org/TR/micropub/#reserved-properties
 * @see https://www.w3.org/TR/micropub/#syndication-targets
 * @see https://www.w3.org/TR/micropub/#vocabulary-p-1
 * @see https://indieweb.org/Micropub-extensions
 * @see https://indieweb.org/mp-syndicate-to
 */

import { Type } from '@sinclair/typebox'

export const access_token = Type.String({
  $id: 'mp-access-token',
  description: 'The OAuth Bearer token authenticating the request.'
})

export const action = Type.Union(
  [
    Type.Literal('create'),
    Type.Literal('update'),
    Type.Literal('delete'),
    Type.Literal('undelete')
  ],
  {
    $id: 'mp-action',
    description:
      'Action to perform on the object (updates are not supported in the form-encoded syntax).',
    default: 'create'
  }
)

export const h = Type.Union(
  [
    Type.Literal('card'),
    Type.Literal('cite'),
    Type.Literal('entry'),
    Type.Literal('event')
  ],
  {
    description: 'used to specify the object type being created',
    default: 'entry'
  }
)

export const mp_channel = Type.String()

export const mp_destination = Type.String({
  $id: 'mp-destination',
  description:
    'Specify a destination to create a new post on a web site other than the default.'
  // format: 'uri'
})

export const mp_limit = Type.Number({
  minimum: 0,
  $id: 'mp-limit',
  description:
    'Adds the parameter limit to any query to limit the number of returned results.'
})

export const mp_post_status = Type.String({
  $id: 'mp-post-status',
  description: 'Allows a Micropub client to set the status of a post.'
})

export const mp_slug = Type.String({
  $id: 'mp-slug',
  description:
    'Allows a Micropub client to suggest a slug to the Micropub endpoint.',
  minLength: 1
})

const mp_syndicate_to_item = Type.String({
  description: 'syndication target',
  format: 'uri'
})

export const mp_syndicate_to = Type.Union(
  [mp_syndicate_to_item, Type.Array(mp_syndicate_to_item)],
  {
    $id: 'mp-syndicate-to',
    description: 'Syndication target/s'
  }
)

export const mp_visibility = Type.Union(
  [Type.Literal('public'), Type.Literal('private'), Type.Literal('unlisted')],
  {
    $id: 'mp-visibility',
    description:
      'Adds a property for use in Micropub requests called visibility that informs a server whether a post should be public, private or unlisted.',
    default: 'public'
  }
)
