import { Static, Type } from '@sinclair/typebox'

export const storage_name = Type.String({
  description: 'Storage backend.',
  title: 'Storage name'
})

export const info = Type.Object({
  name: storage_name
})

export type Info = Static<typeof info>
