import { Static, Type } from '@sinclair/typebox'

export const p_author = Type.String({
  $id: 'p-author',
  description: 'The author (use in h-entry, h-recipe)',
  title: 'author',
  minLength: 1
})

export type P_Author = Static<typeof p_author>
