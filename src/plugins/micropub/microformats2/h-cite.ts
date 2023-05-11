import { Static, Type } from '@sinclair/typebox'
import { date, date_time, string_or_html_and_value } from './base.js'

/**
 * microformats2 h-cite.
 *
 * See:
 * - https://microformats.org/wiki/h-cite
 * - https://indieweb.org/h-cite
 */
export const h_cite = Type.Object(
  {
    /**
     * date the cited work was accessed for whatever reason it is being cited.
     * Useful in case online work changes and it's possible to access the
     * dt-accessed datetimestamped version in particular, e.g. via the Internet
     * Archive.
     */
    accessed: Type.Optional(date_time),

    /**
     * author of publication, with optional nested h-card
     *
     * TODO: author could be either a string or a h-cite itself.
     * See here:
     * - https://github.com/sinclairzx81/typebox#types-recursive
     * - https://github.com/grantcodes/postr/blob/master/schema/hCite.js
     */
    author: Type.String(),

    /**
     * for when the citation includes the content itself, like when citing short
     * text notes (e.g. tweets).
     */
    content: Type.Optional(string_or_html_and_value),

    /**
     * name of the work
     */
    name: Type.String(),

    /**
     * for citing articles in publications with more than one author, or perhaps
     * when the author has a specific publication vehicle for the cited work.
     * Also works when the publication is known, but the authorship information is
     * either unknown, ambiguous, unclear, or collaboratively complex enough to be
     * unable to list explicit author(s), e.g. like with many wiki pages.
     */
    publication: Type.Optional(Type.String()),

    /**
     * date (and optionally time) of publication
     */
    published: Type.Optional(Type.Union([date, date_time])),

    /**
     * a URL/URI that uniquely/canonically identifies the cited work, canonical
     * permalink.
     */
    uid: Type.Optional(Type.String({ format: 'uri' })),

    /**
     * a URL to access the cited work
     */
    url: Type.Optional(Type.String({ format: 'uri' }))
  },
  {
    $id: 'h-cite',
    title: 'microformats2 h-cite',
    description:
      'h-cite is a simple, open format for publishing citations and references to online and other publications.'
  }
)

export type H_cite = Static<typeof h_cite>
