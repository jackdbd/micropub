import type {
  Blacklist,
  Cleanup,
  Create,
  Delete,
  Get,
  Info,
  Issue,
  Issuelist,
  Jf2ToContent,
  PublishedUrlToStoreLocation,
  Reset,
  Revoke,
  RevokeAll,
  Undelete,
  Update,
  Upload
} from './api.js'
import type {
  BaseValueCleanup,
  BaseValueCreate,
  BaseValueDelete,
  BaseValueGet,
  BaseValueIssue,
  BaseValueReset,
  BaseValueRevoke,
  BaseValueRevokeAll,
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
  VCleanup extends BaseValueCleanup = BaseValueCleanup,
  VIssue extends BaseValueIssue = BaseValueIssue,
  VReset extends BaseValueReset = BaseValueReset,
  VRevoke extends BaseValueRevoke = BaseValueRevoke,
  VRevokeAll extends BaseValueRevokeAll = BaseValueRevokeAll
> {
  blacklist: Blacklist
  cleanup?: Cleanup<VCleanup, E>
  info: Info
  issue: Issue<VIssue, E>
  issuelist: Issuelist
  reset: Reset<VReset, E>
  revoke: Revoke<VRevoke, E>
  revokeAll: RevokeAll<VRevokeAll, E>
}
