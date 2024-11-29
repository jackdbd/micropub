import { Static, Type } from '@sinclair/typebox'

export const p_description = Type.String({
  $id: 'p-description',
  description: 'The description (use in h-event, h-product)',
  title: 'description',
  minLength: 1
})

export type P_Description = Static<typeof p_description>
