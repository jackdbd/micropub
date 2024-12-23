import { Static, Type } from '@sinclair/typebox'

export const telegram = Type.Object({
  chat_id: Type.String({ minLength: 1 }),
  token: Type.String({ minLength: 1 })
})

export type Telegram = Static<typeof telegram>
