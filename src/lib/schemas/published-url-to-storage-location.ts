import { Static, Type } from '@sinclair/typebox'
import { location } from './location.js'
import { url } from './url.js'

export const publishedUrlToStorageLocation = Type.Function([url], location)

export type PublishedUrlToStorageLocation = Static<
  typeof publishedUrlToStorageLocation
>
