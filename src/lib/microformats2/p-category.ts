import { Static, Type } from '@sinclair/typebox'

const p_category_item = Type.String({ minLength: 1 })

export const p_category = Type.Union(
  [p_category_item, Type.Array(p_category_item)],
  {
    $id: 'p-category',
    description: 'category/categories',
    title: 'category'
  }
)

export type P_Category = Static<typeof p_category>
