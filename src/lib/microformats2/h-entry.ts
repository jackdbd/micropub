import { Static, Type } from '@sinclair/typebox'
import { dt_published } from './dt-published.js'
import { dt_updated } from './dt-updated.js'
import { p_author } from './p-author.js'
import { p_category } from './p-category.js'
import { p_content } from './p-content.js'
import { p_geo } from './p-geo.js'
import { p_location } from './p-location.js'
import { p_name } from './p-name.js'
import { p_rsvp } from './p-rsvp.js'
import { p_summary } from './p-summary.js'
import { u_uid } from './u-uid.js'
import { u_url } from './u-url.js'
import { u_syndication } from './u-syndication.js'
import { h_adr } from './h-adr.js'
import { e_content } from './e-content.js'
import { h_card } from './h-card.js'
import { h_cite } from './h-cite.js'

/**
 * microformats2 h-entry.
 *
 * All properties are optional and may be plural.
 *
 * @see https://randomgeekery.org/post/2020/04/h-entry-microformat-for-indieweb-posts/
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/microformats#h-entry
 * @see https://microformats.org/wiki/h-entry
 * @see https://indieweb.org/h-entry
 */
export const h_entry = Type.Object(
  {
    /**
     * who wrote the entry, optionally embedded h-card(s)
     */
    author: Type.Optional(Type.Union([Type.Ref(p_author), Type.Ref(h_card)])),

    'bookmark-of': Type.Optional(Type.Ref(u_url)),

    category: Type.Optional(Type.Ref(p_category)),

    /**
     * full content of the entry
     */
    content: Type.Optional(
      Type.Union([Type.Ref(p_content), Type.Ref(e_content)])
    ),

    /**
     * the URL which the h-entry is considered reply to (i.e. doesn’t make sense
     * without context, could show up in comment thread), optionally an embedded
     * h-cite (reply-context)
     */
    'in-reply-to': Type.Optional(Type.Ref(u_url)),

    /**
     * the URL which the h-entry is considered a “like” (favorite, star) of.
     * Optionally an embedded h-cite
     */
    'like-of': Type.Optional(Type.Ref(u_url)),

    /**
     * location the entry was posted from, optionally embed h-card, h-adr, or
     * h-geo. We need to use Type.Ref(), otherwise we get this error:
     * Error: reference "h-card" resolves to more than one schema
     *
     * Location can be:
     * 1. A plaintext string describing the location
     * 2. A Geo URI [RFC5870], for example: geo:45.51533714,-122.646538633
     * 3. A URL that contains an h-card
     * 4. A nested h-adr object
     *
     * https://micropub.spec.indieweb.org/#examples-of-creating-objects
     */

    location: Type.Optional(
      Type.Union(
        [
          Type.Ref(p_location),
          Type.Ref(p_geo),
          Type.Ref(u_url),
          Type.Ref(h_adr)
        ],
        {
          $id: 'entry-location',
          title: 'location',
          description: 'Location of the entry.'
        }
      )
    ),

    /**
     * entry name/title
     */
    name: Type.Optional(Type.Ref(p_name)),

    published: Type.Optional(Type.Ref(dt_published)),

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
    'repost-of': Type.Optional(Type.Ref(u_url)),

    rsvp: Type.Optional(Type.Ref(p_rsvp)),

    summary: Type.Optional(Type.Ref(p_summary)),

    syndication: Type.Optional(Type.Ref(u_syndication)),

    type: Type.Optional(Type.Literal('entry', { default: 'entry' })),

    updated: Type.Optional(Type.Ref(dt_updated)),

    /**
     * universally unique identifier, typically canonical entry URL
     */
    uri: Type.Optional(Type.Ref(u_uid)),

    /**
     *  entry permalink URL
     */
    url: Type.Optional(Type.Ref(u_url))
  },
  {
    $id: 'h-entry',
    title: 'microformats2 h-entry',
    description:
      'h-entry is the microformats2 vocabulary for marking up blog posts on web sites. It can also be used to mark-up any other episodic or time series based content.',
    examples: [
      { content: 'A plain text note' },
      {
        content: {
          text: 'this is a note',
          html: '<p>This <b>is</b> a note</p>'
        },
        published: '2024-11-12T23:20:50.52Z',
        updated: '2024-11-29T23:20:50.52Z'
      },
      {
        'bookmark-of': 'https://mxb.dev/blog/make-free-stuff/',
        content: 'Nice article!'
      },
      {
        'like-of': 'http://othersite.example.com/permalink47'
      },
      {
        'repost-of': 'https://example.com/post',
        content: {
          html: '<p>You should read this <strong>awesome</strong> article</p>'
        }
      },
      {
        'in-reply-to':
          'https://aaronparecki.com/2014/09/13/7/indieweb-xoxo-breakfast',
        rsvp: 'maybe'
      }
    ]
  }
)

export type H_Entry = Static<typeof h_entry>
