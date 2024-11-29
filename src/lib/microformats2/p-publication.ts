import { Static, Type } from '@sinclair/typebox'

export const p_publication = Type.String({
  $id: 'p-publication',
  description: 'For citing articles, books, etc (used in h-cite)',
  title: 'publication',
  minLength: 1
})

export type P_Publication = Static<typeof p_publication>
