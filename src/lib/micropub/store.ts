import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { UpdatePatch } from './actions.js'
import type { Location } from './publication.js'

export interface Failure<E> {
  error: E
  value?: undefined
}

export interface Success<V> {
  error?: undefined
  value: V
}

export type Result<E, V> = Failure<E> | Success<V>

export type Create<E, V> = (jf2: Jf2) => Promise<Result<E, V>>

export type Get<E, V> = (loc: Location) => Promise<Result<E, V>>

/**
 * Updating entries is done by sending an HTTP POST with a JSON payload
 * describing the changes to make.
 *
 * @see https://micropub.spec.indieweb.org/#update-p-2
 * @see https://micropub.spec.indieweb.org/#update-p-3
 */
export type Update<E, V> = (
  url: string,
  patch: UpdatePatch
) => Promise<Result<E, V>>

export type Delete<E, V> = (url: string) => Promise<Result<E, V>>

export type Undelete<E, V> = (url: string) => Promise<Result<E, V>>

export type Jf2ToContent = (jf2: Jf2) => string

export interface BaseError {
  status_code?: number
  status_text?: string
  error_description?: string
}

export interface BaseValue {
  status_code?: number
  status_text?: string
  summary?: string
  payload?: any
}

/**
 * Each store might store the microformats2 JSON sent by a Micropub client in a
 * different way. For example, the GitHub store requires the content to be
 * a base64 encoded string.
 */
export interface Store<
  StoreError extends BaseError = BaseError,
  StoreValue extends BaseValue = BaseValue
> {
  create: Create<StoreError, StoreValue>
  delete?: Delete<StoreError, StoreValue>
  get: Get<StoreError, StoreValue>
  info: () => string
  jf2ToContent: Jf2ToContent
  name: string
  publishedUrlToStoreLocation: (url: string) => Location
  undelete?: Undelete<StoreError, StoreValue>
  update?: Update<StoreError, StoreValue>
}
