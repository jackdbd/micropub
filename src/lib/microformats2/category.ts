import { Type } from '@sinclair/typebox'

const category_item = Type.String({ description: 'category/tag' })

export const category = Type.Union([category_item, Type.Array(category_item)])
