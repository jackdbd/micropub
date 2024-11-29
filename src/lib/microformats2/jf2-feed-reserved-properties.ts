/**
 * Reserved properties for JF2 Feed.
 *
 * @see https://www.w3.org/TR/jf2/#jf2feed_required_fields
 */
import { Type } from '@sinclair/typebox'

// TODO: finish implementing this.

export const jf2_feed_type = Type.String({
  title: 'type',
  description: 'MUST be defined with a value of "feed" on the top level entry.'
})
