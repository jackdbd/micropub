import { Static, Type } from '@sinclair/typebox'

export const p_name = Type.String({
  $id: 'p-name',
  description:
    'Name to use in h-entry, h-event, h-item, h-product, h-recipe, h-review, h-review-aggregate.',
  minLength: 1
})

export type P_Name = Static<typeof p_name>
