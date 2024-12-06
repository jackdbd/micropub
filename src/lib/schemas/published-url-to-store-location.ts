import { Static, Type } from '@sinclair/typebox'
import { location } from './location.js'
import { url } from './url.js'

const publishedUrlToStoreLocation_ = Type.Function([url], location)

export type PublishedUrlToStoreLocation = Static<
  typeof publishedUrlToStoreLocation_
>

export const publishedUrlToStoreLocation = Type.Any()
