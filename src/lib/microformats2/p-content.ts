import { Static, Type } from '@sinclair/typebox'

export const p_content = Type.String({
  $id: 'p-content',
  description: 'Some plain text content',
  title: 'content',
  minLength: 1
})

export type P_Content = Static<typeof p_content>
