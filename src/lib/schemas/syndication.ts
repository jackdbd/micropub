import { retrieveContent, update } from '@jackdbd/fastify-micropub-endpoint'
import type {
  RetrieveContent,
  Update
} from '@jackdbd/fastify-micropub-endpoint'
import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'

export const url = Type.String({
  description: 'A URL',
  format: 'uri'
})

export const websiteUrlToStoreLocation = Type.Function(
  [url],
  Type.String({ minLength: 1 })
)

export type WebsiteUrlToStoreLocation = Static<typeof websiteUrlToStoreLocation>

export const store = Type.Object({
  get: retrieveContent,
  info,
  update,
  websiteUrlToStoreLocation
})

export interface Store extends Static<typeof store> {
  get: RetrieveContent
  update: Update
  websiteUrlToStoreLocation: WebsiteUrlToStoreLocation
}
