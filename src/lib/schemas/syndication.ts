import {
  retrievePost,
  updatePost,
  websiteUrlToStoreLocation
} from '@jackdbd/micropub/schemas/user-provided-functions'
import type {
  RetrievePost,
  UpdatePost,
  WebsiteUrlToStoreLocation
} from '@jackdbd/micropub/schemas/user-provided-functions'
import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'

export const url = Type.String({
  description: 'A URL',
  format: 'uri'
})

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
