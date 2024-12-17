import { Static, Type } from '@sinclair/typebox'
import { location } from './location.js'
import { url } from './url.js'

const publishedUrlToStorageLocation_ = Type.Function([url], location)

export type PublishedUrlToStorageLocation = Static<
  typeof publishedUrlToStorageLocation_
>

export const publishedUrlToStorageLocation = Type.Any()
