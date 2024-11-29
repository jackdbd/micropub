import { Static, Type } from '@sinclair/typebox'

export const u_uid = Type.String({
  $id: 'u-uid',
  description: 'URL/URI that uniquely/canonically identifies the object)',
  format: 'uri'
})

export type U_UID = Static<typeof u_uid>
