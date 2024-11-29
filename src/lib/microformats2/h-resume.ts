import { Static, Type } from '@sinclair/typebox'
import { p_name } from './p-name.js'
import { p_summary } from './p-summary.js'

/**
 * microformats2 h-resume.
 *
 * All properties are optional.
 *
 * @see https://microformats.org/wiki/h-resume
 * @see https://microformats.org/wiki/microformats2#h-resume
 */
export const h_resume = Type.Object(
  {
    name: Type.Optional(Type.Ref(p_name)),
    summary: Type.Optional(Type.Ref(p_summary)),
    contact: Type.Optional(Type.String()),
    education: Type.Optional(Type.String()),
    experience: Type.Optional(Type.String()),
    skill: Type.Optional(Type.String()),
    affiliation: Type.Optional(Type.String()),
    type: Type.Literal('resume')
  },
  {
    $id: 'h-resume',
    title: 'microformats2 h-resume',
    description: '',
    // https://web.archive.org/web/20160309095003/http://csarven.ca/cv
    examples: [
      {
        name: "John Smith's resume"
      }
    ]
  }
)

export type H_Resume = Static<typeof h_resume>
