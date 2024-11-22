import { Static, Type } from '@sinclair/typebox'
import { category, date_time, string_or_html_and_value } from './base.js'
import { h_adr } from './h-adr.js'
import { h_card } from './h-card.js'
import { h_cite } from './h-cite.js'
import { h_geo } from './h-geo.js'
import { mp_slug, mp_syndicate_to } from './micropub-commands.js'

/**
 * microformats2 h-entry.
 *
 * All properties are optional and may be plural.
 *
 * Properties starting with 'mp-' are reserved as a mechanism for Micropub
 * clients to give commands to Micropub servers.
 *
 * https://www.w3.org/TR/micropub/#reserved-properties
 *
 * Clients and servers wishing to experiment with creating new mp- commands are encouraged to brainstorm and document
 * implementations at indieweb.org/Micropub-extensions.
 *
 * https://indieweb.org/Micropub-extensions
 *
 * See also:
 *
 * - https://microformats.org/wiki/h-entry
 * - https://indieweb.org/h-entry
 * - https://randomgeekery.org/post/2020/04/h-entry-microformat-for-indieweb-posts/
 * - https://indieweb.org/Micropub#Examples_of_Creating_Objects
 * - https://www.w3.org/TR/micropub/#syndication-targets
 * - https://indieweb.org/mp-syndicate-to
 */
export const h_entry = Type.Object(
  {
    /**
     * who wrote the entry, optionally embedded h-card(s)
     */
    author: Type.Optional(Type.Union([Type.String(), Type.Ref(h_card)])),

    'bookmark-of': Type.Optional(Type.String({ format: 'uri' })),

    /**
     * entry categories/tags
     */
    category: Type.Optional(category),

    /**
     * full content of the entry
     */
    content: Type.Optional(string_or_html_and_value),

    /**
     * the URL which the h-entry is considered reply to (i.e. doesn’t make sense
     * without context, could show up in comment thread), optionally an embedded
     * h-cite (reply-context)
     */
    'in-reply-to': Type.Optional(Type.String({ format: 'uri' })),

    /**
     * the URL which the h-entry is considered a “like” (favorite, star) of.
     * Optionally an embedded h-cite
     */
    'like-of': Type.Optional(Type.String({ format: 'uri' })),

    /**
     * location the entry was posted from, optionally embed h-card, h-adr, or
     * h-geo. We need to use Type.Ref(), otherwise we get this error:
     * Error: reference "h-card" resolves to more than one schema
     *
     * Location can be:
     * 1. A plaintext string describing the location
     * 2. A nested h-adr object
     * 3. A URL that contains an h-card
     * 4. A Geo URI [RFC5870], for example: geo:45.51533714,-122.646538633
     *
     * https://micropub.spec.indieweb.org/#examples-of-creating-objects
     */
    location: Type.Optional(
      Type.Union([
        Type.String(),
        Type.Ref(h_adr),
        Type.Ref(h_card),
        Type.Ref(h_geo)
      ])
    ),

    'mp-slug': Type.Optional(mp_slug),

    'mp-syndicate-to': Type.Optional(mp_syndicate_to),

    /**
     * entry name/title
     */
    name: Type.Optional(Type.String()),

    /**
     * when the entry was published
     */
    published: Type.Optional(date_time),

    /**
     * it's recommended to use an h-cite for this so you can include author and
     * uid information (ISBN or DOI), but you can use just the title as a
     * minimum viable read post.
     *
     * @see https://indieweb.org/read
     */
    'read-of': Type.Optional(Type.Union([Type.String(), Type.Ref(h_cite)])),

    /**
     * the URL which the h-entry is considered a “repost” of. Optionally an
     * embedded h-cite.
     */
    'repost-of': Type.Optional(Type.String({ format: 'uri' })),

    /**
     * enum, use <data> element or Value Class Pattern
     * https://microformats.org/wiki/value-class-pattern
     */
    rsvp: Type.Optional(
      Type.Union([
        Type.Literal('yes'),
        Type.Literal('no'),
        Type.Literal('maybe'),
        Type.Literal('interested')
      ])
    ),

    /**
     * short entry summary
     */
    summary: Type.Optional(Type.String()),

    /**
     * URL(s) of syndicated copies of this post. The property equivalent of rel-syndication.
     */
    syndication: Type.Optional(Type.String()),

    /**
     * when the entry was updated
     */
    updated: Type.Optional(date_time),

    /**
     * universally unique identifier, typically canonical entry URL
     */
    uri: Type.Optional(Type.String({ format: 'uri' })),

    /**
     *  entry permalink URL
     */
    url: Type.Optional(Type.String({ format: 'uri' }))
  },
  {
    $id: 'h-entry',
    title: 'microformats2 h-entry',
    description:
      'h-entry is the microformats2 vocabulary for marking up blog posts on web sites. It can also be used to mark-up any other episodic or time series based content.',
    examples: [
      { content: 'this is a note' },
      {
        content: {
          value: 'this is a note',
          html: '<p>This <b>is</b> a note</p>'
        },
        'mp-slug': 'test-note',
        published: '1985-04-12T23:20:50.52Z'
      },
      {
        'like-of': 'http://othersite.example.com/permalink47'
      },
      {
        'repost-of': 'https://example.com/post'
      }
    ]
  }
)

export type H_entry = Static<typeof h_entry>
