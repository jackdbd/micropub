import type {
  Create,
  Delete,
  Get,
  Info,
  Jf2ToContent,
  PublishedUrlToStoreLocation,
  Undelete,
  Update,
  Upload
} from './api.js'
import type {
  BaseValueCreate,
  BaseValueDelete,
  BaseValueGet,
  BaseValueUndelete,
  BaseValueUpdate,
  BaseValueUpload
} from './values.js'

export interface MediaInfo extends Info {
  public_root_url: string
}

export interface ContentStore<
  E extends Error = Error,
  VCreate extends BaseValueCreate = BaseValueCreate,
  VDelete extends BaseValueDelete = BaseValueDelete,
  VUndelete extends BaseValueUndelete = BaseValueUndelete,
  VUpdate extends BaseValueUpdate = BaseValueUpdate
> {
  create: Create<VCreate, E>
  delete?: Delete<VDelete, E>
  info: Info
  jf2ToContent: Jf2ToContent
  publishedUrlToStoreLocation: PublishedUrlToStoreLocation
  undelete?: Undelete<VUndelete, E>
  update: Update<VUpdate, E>
}

export interface MediaStore<
  E extends Error = Error,
  VDelete extends BaseValueDelete = BaseValueDelete,
  VUpload extends BaseValueUpload = BaseValueUpload
> {
  upload: Upload<VUpload, E>
  delete?: Delete<VDelete, E>
  info: MediaInfo
}

export interface SyndicatorStore<
  E extends Error = Error,
  VGet extends BaseValueGet = BaseValueGet,
  VUpdate extends BaseValueUpdate = BaseValueUpdate
> {
  get: Get<VGet, E>
  info: Info
  publishedUrlToStoreLocation: PublishedUrlToStoreLocation
  update: Update<VUpdate, E>
}
