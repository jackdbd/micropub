import type {
  Create,
  Delete,
  Get,
  Info,
  Init,
  Issue,
  Jf2ToContent,
  PublishedUrlToStoreLocation,
  Revoke,
  RevokeAll,
  SetSecret,
  Undelete,
  Update,
  Upload
} from './api.js'
import type {
  BaseValueCreate,
  BaseValueDelete,
  BaseValueGet,
  BaseValueInit,
  BaseValueIssue,
  BaseValueRevoke,
  BaseValueRevokeAll,
  BaseValueSetSecret,
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

export interface TokenStore<
  E extends Error = Error,
  VInit extends BaseValueInit = BaseValueInit,
  VIssue extends BaseValueIssue = BaseValueIssue,
  VRevoke extends BaseValueRevoke = BaseValueRevoke,
  VRevokeAll extends BaseValueRevokeAll = BaseValueRevokeAll,
  VSetSecret extends BaseValueSetSecret = BaseValueSetSecret
> {
  blacklist: () => Promise<Set<string>>
  cleanup?: () => Promise<void>
  info: Info
  init: Init<VInit, E>
  issue: Issue<VIssue, E>
  issuelist: () => Promise<Set<string>>
  revoke: Revoke<VRevoke, E>
  revokeAll: RevokeAll<VRevokeAll, E>
  setSecret: SetSecret<VSetSecret, E>
}
