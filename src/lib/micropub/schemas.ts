import { Type } from '@sinclair/typebox'

export const media_endpoint = Type.String({
  format: 'uri',
  title: 'Media endpoint'
})

export const micropub_endpoint = Type.String({
  format: 'uri',
  title: 'Micropub endpoint'
})
