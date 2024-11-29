import { Static, Type } from '@sinclair/typebox'

export const p_location = Type.String({
  $id: 'p-location',
  description: 'Location in plain text.',
  minLength: 1
})

export type P_Location = Static<typeof p_location>
