import { Type } from '@sinclair/typebox'

export const url = Type.String({
  description: 'A URL',
  format: 'uri'
})
