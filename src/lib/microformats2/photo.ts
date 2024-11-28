import { type Static, Type } from '@sinclair/typebox'

const alt = Type.String({
  format: 'uri',
  description: 'Alternate text for the photo, if the photo cannot be displayed'
})

const url = Type.String({
  format: 'uri',
  description: 'URL of the photo'
})

const alt_and_url = Type.Object(
  { alt, url },
  { description: 'Photo with alternate text' }
)

const photo_item = Type.Union([url, alt_and_url])

export const photo = Type.Union([photo_item, Type.Array(photo_item)])

export type Photo = Static<typeof photo>
