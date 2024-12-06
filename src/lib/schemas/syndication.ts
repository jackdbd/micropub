import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'
import { get, type Get } from './get-content.js'
import {
  publishedUrlToStoreLocation,
  type PublishedUrlToStoreLocation
} from './published-url-to-store-location.js'
import { update, type Update } from './update-content.js'

export const store = Type.Object({
  get,
  info,
  publishedUrlToStoreLocation,
  update
})

export interface Store extends Static<typeof store> {
  get: Get
  publishedUrlToStoreLocation: PublishedUrlToStoreLocation
  update: Update
}
