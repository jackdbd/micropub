import { Static, Type } from '@sinclair/typebox'

export const location = Type.Object({
  store: Type.String({ minLength: 1 }),
  store_deleted: Type.Optional(Type.String({ minLength: 1 })),
  website: Type.String({ minLength: 1 })
})

export type Location = Static<typeof location>
