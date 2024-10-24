import { Static, Type } from '@sinclair/typebox'
import { date_time, string_or_html_and_value } from './base.js'
import { h_adr } from './h-adr.js'
import { h_card } from './h-card.js'
import { h_geo } from './h-geo.js'

/**
 * microformats2 h-entry.
 *
 * All properties are optional and may be plural. See:
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

    // 'bookmark-of': Type.Optional(Type.String({ format: 'uri' })),

    /**
     * entry categories/tags
     */
    category: Type.Optional(Type.String()),

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
     */
    location: Type.Optional(
      Type.Union([Type.Ref(h_adr), Type.Ref(h_card), Type.Ref(h_geo)])
    ),

    /**
     * entry name/title
     */
    name: Type.Optional(Type.String()),

    /**
     * when the entry was published
     */
    published: Type.Optional(date_time),

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

    // TODO: mp-syndicate-to

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
