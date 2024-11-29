import { Static, Type } from '@sinclair/typebox'

export const p_summary = Type.String({
  $id: 'p-summary',
  description: 'Summary to use in h-entry, h-recipe, h-resume.',
  minLength: 1
})

export type P_Summary = Static<typeof p_summary>
