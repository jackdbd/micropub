import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'

export interface StoreFailure {
  error: { message: string; status_code: number; status_text: string }
  value: undefined
}

export interface StoreSuccess {
  error: undefined
  value: { message: string; body?: any; status_code: number }
}

export type StoreResult = StoreFailure | StoreSuccess

// path-based store (e.g. filesystem, object storage)

export interface StoreGetConfig {
  path: string
}

export interface StoreCreateConfig {
  content: string
  path: string
}

export interface StoreUpdateConfig {
  content: string
  path: string
  sha: string
}

export interface StoreDeleteConfig {
  path: string
}

export interface StoreUndeleteConfig {
  path: string
}

export type Create = (cfg: StoreCreateConfig) => Promise<StoreResult>
export type Get = (cfg: StoreGetConfig) => Promise<StoreResult>
export type Update = (cfg: StoreUpdateConfig) => Promise<StoreResult>
export type Delete = (cfg: StoreDeleteConfig) => Promise<StoreResult>
export type Undelete = (cfg: StoreUndeleteConfig) => Promise<StoreResult>
export type Jf2ToContent = (jf2: Jf2) => string

// TODO: table-based store (e.g. database)

// export interface PublishedUrlToStoreLocationConfig<T = {}> {
//   url: string
//   spec: T
// }

export interface PublishedUrlToStoreLocationConfig {
  url: string
  deleted?: boolean
}

// TODO: each store might store the microformats2 JSON sent by a Micropub client
// in a different way. For example, the GitHub store requires the content to be
// a base64 encoded string.
// export const mf2ToContent = () => {}

export interface Store {
  // create: PathStoreCreate | TableStoreCreate
  create: Create
  delete: Delete
  get: Get
  jf2ToContent: Jf2ToContent
  publishedUrlToStoreLocation: (
    cfg: PublishedUrlToStoreLocationConfig
  ) => string
  undelete: Undelete
  update: Update
}
