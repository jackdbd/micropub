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

export type StoreCreate = (cfg: StoreCreateConfig) => Promise<StoreResult>
export type StoreGet = (cfg: StoreGetConfig) => Promise<StoreResult>
export type StoreUpdate = (cfg: StoreUpdateConfig) => Promise<StoreResult>
export type StoreDelete = (cfg: StoreDeleteConfig) => Promise<StoreResult>
export type StoreUndelete = (cfg: StoreUndeleteConfig) => Promise<StoreResult>

// TODO: table-based store (e.g. database)

// export interface PublishedUrlToStoreLocationConfig<T = {}> {
//   url: string
//   spec: T
// }

export interface PublishedUrlToStoreLocationConfig {
  url: string
  deleted?: boolean
}

export interface Store {
  // create: PathStoreCreate | TableStoreCreate
  create: StoreCreate
  get: StoreGet
  update: StoreUpdate
  delete: StoreDelete
  undelete: StoreUndelete
  publishedUrlToStoreLocation: (
    cfg: PublishedUrlToStoreLocationConfig
  ) => string
}
