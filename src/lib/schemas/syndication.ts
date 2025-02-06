import {
  retrievePost,
  updatePost
} from '@jackdbd/micropub/schemas/user-provided-functions'
import type {
  RetrievePost,
  UpdatePost
} from '@jackdbd/micropub/schemas/user-provided-functions'
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
  get: retrievePost,
  info,
  update: updatePost,
  websiteUrlToStoreLocation
})

export interface Store extends Static<typeof store> {
  get: RetrievePost
  update: UpdatePost
  websiteUrlToStoreLocation: WebsiteUrlToStoreLocation
}
