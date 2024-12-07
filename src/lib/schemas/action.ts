import { Static, Type } from '@sinclair/typebox'

export const action = Type.Union([
  Type.Literal('delete'),
  Type.Literal('undelete'),
  Type.Literal('update'),
  Type.Literal('create')
])

export type Action = Static<typeof action>
