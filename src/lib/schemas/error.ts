import { Static, Type } from '@sinclair/typebox'

export const error = Type.Object({
  message: Type.String(),
  name: Type.String(),
  stack: Type.Optional(Type.String())
})

export type Error = Static<typeof error>
