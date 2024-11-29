import { Static, Type } from '@sinclair/typebox'

/**
 * enum, use <data> element or Value Class Pattern
 *
 * @see https://indieweb.org/rsvp
 * @see https://microformats.org/wiki/value-class-pattern
 */
export const p_rsvp = Type.Union(
  [
    Type.Literal('yes'),
    Type.Literal('no'),
    Type.Literal('maybe'),
    Type.Literal('interested')
  ],
  {
    $id: 'p-rsvp',
    description:
      'An RSVP is a reply to an event that says whether the sender is attending, is not attending, might attend, or is merely interested.'
  }
)

export type P_RSVP = Static<typeof p_rsvp>
