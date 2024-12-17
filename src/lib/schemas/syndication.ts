import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'
import { get, type Get } from './get-content.js'
import {
  publishedUrlToStorageLocation,
  type PublishedUrlToStorageLocation
} from './published-url-to-storage-location.js'
import { update, type Update } from './update-content.js'

export const store = Type.Object({
  get,
  info,
  publishedUrlToStorageLocation,
  update
})

export interface Store extends Static<typeof store> {
  get: Get
  publishedUrlToStorageLocation: PublishedUrlToStorageLocation
  update: Update
}
