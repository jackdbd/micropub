import { type Static, Type } from '@sinclair/typebox'

export const u_photo = Type.String({
  $id: 'u-photo',
  description: 'URL of a photo',
  format: 'uri'
})

export type U_Photo = Static<typeof u_photo>
