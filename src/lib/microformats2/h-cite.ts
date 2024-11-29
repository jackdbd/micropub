import { Static, Type } from '@sinclair/typebox'
import { dt_accessed } from './dt-accessed.js'
import { dt_published } from './dt-published.js'
import { p_author } from './p-author.js'
import { p_content } from './p-content.js'
import { p_name } from './p-name.js'
import { p_publication } from './p-publication.js'
import { u_uid } from './u-uid.js'
import { u_url } from './u-url.js'

/**
 * microformats2 h-cite.
 *
 * @see https://microformats.org/wiki/h-cite
 * @see https://indieweb.org/h-cite
 */
export const h_cite = Type.Object(
  {
    /**
     * date the cited work was accessed for whatever reason it is being cited.
     * Useful in case online work changes and it's possible to access the
     * dt-accessed datetimestamped version in particular, e.g. via the Internet
     * Archive.
     */
    accessed: Type.Optional(Type.Ref(dt_accessed)),

    /**
     * author of publication, with optional nested h-card
     *
     * TODO: author could be either a string or a h-cite itself.
     * See here:
     * - https://github.com/sinclairzx81/typebox#types-recursive
     * - https://github.com/grantcodes/postr/blob/master/schema/hCite.js
     */
    author: Type.Optional(Type.Ref(p_author)),

    /**
     * for when the citation includes the content itself, like when citing short
     * text notes (e.g. tweets).
     */
    content: Type.Optional(Type.Ref(p_content)),

    /**
     * name of the work
     */
    name: Type.Optional(Type.Ref(p_name)),

    /**
     * for citing articles in publications with more than one author, or perhaps
     * when the author has a specific publication vehicle for the cited work.
     * Also works when the publication is known, but the authorship information is
     * either unknown, ambiguous, unclear, or collaboratively complex enough to be
     * unable to list explicit author(s), e.g. like with many wiki pages.
     */
    publication: Type.Optional(Type.Ref(p_publication)),

    /**
     * date (and optionally time) of publication
     */
    published: Type.Optional(Type.Ref(dt_published)),

    type: Type.Literal('cite'),

    /**
     * a URL/URI that uniquely/canonically identifies the cited work, canonical
     * permalink.
     */
    uid: Type.Optional(Type.Ref(u_uid)),

    /**
     * a URL to access the cited work
     */
    url: Type.Optional(Type.Ref(u_url))
  },
  {
    $id: 'h-cite',
    title: 'microformats2 h-cite',
    description:
      'h-cite is a simple, open format for publishing citations and references to online and other publications.',
    examples: [
      {
        author: 'Isaac Newton',
        name: 'The Correspondence of Isaac Newton: Volume 5',
        content:
          'If I have seen further it is by standing on the shoulders of Giants.'
      }
    ]
  }
)

export type H_Cite = Static<typeof h_cite>
