import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { JWTPayload } from 'jose'
import type { Location } from '../publication.js'
import type { UpdatePatch } from './actions.js'
import type { UploadConfig } from './configs.js'
import type { Result } from './result.js'
import type {
  BaseValueBlacklist,
  BaseValueCleanup,
  BaseValueCreate,
  BaseValueDelete,
  BaseValueGet,
  BaseValueIssue,
  BaseValueIssuelist,
  BaseValueReset,
  BaseValueRevoke,
  BaseValueRevokeAll,
  BaseValueUndelete,
  BaseValueUpdate,
  BaseValueUpload
} from './values.js'

export type Blacklist<
  V extends BaseValueBlacklist = BaseValueBlacklist,
  E extends Error = Error
> = () => Promise<Result<E, V>>

export type Cleanup<
  V extends BaseValueCleanup = BaseValueCleanup,
  E extends Error = Error
> = () => Promise<Result<E, V>>

export type Create<
  V extends BaseValueCreate = BaseValueCreate,
  E extends Error = Error
> = (jf2: Jf2) => Promise<Result<E, V>>

export type Delete<
  V extends BaseValueDelete = BaseValueDelete,
  E extends Error = Error
> = (url: string) => Promise<Result<E, V>>

export type Get<
  V extends BaseValueGet = BaseValueGet,
  E extends Error = Error
> = (loc: Location) => Promise<Result<E, V>>

export interface Info {
  name: string
}

export type Issue<
  V extends BaseValueIssue = BaseValueIssue,
  E extends Error = Error
> = (payload: JWTPayload) => Promise<Result<E, V>>

export type Issuelist<
  V extends BaseValueIssuelist = BaseValueIssuelist,
  E extends Error = Error
> = () => Promise<Result<E, V>>

export type Jf2ToContent = (jf2: Jf2) => string

export type PublishedUrlToStoreLocation = (url: string) => Location

export type Reset<
  V extends BaseValueReset = BaseValueReset,
  E extends Error = Error
> = () => Promise<Result<E, V>>

export type Revoke<
  V extends BaseValueRevoke = BaseValueRevoke,
  E extends Error = Error
> = (jwt: string) => Promise<Result<E, V>>

export type RevokeAll<
  V extends BaseValueRevokeAll = BaseValueRevokeAll,
  E extends Error = Error
> = () => Promise<Result<E, V>>

export type Undelete<
  V extends BaseValueUndelete = BaseValueUndelete,
  E extends Error = Error
> = (url: string) => Promise<Result<E, V>>

/**
 * Updating entries is done by sending an HTTP POST with a JSON payload
 * describing the changes to make.
 *
 * @see https://micropub.spec.indieweb.org/#update-p-2
 * @see https://micropub.spec.indieweb.org/#update-p-3
 */
export type Update<
  V extends BaseValueUpdate = BaseValueUpdate,
  E extends Error = Error
> = (url: string, patch: UpdatePatch) => Promise<Result<E, V>>

/**
 * Uploads a file to the Media Endpoint.
 *
 * To upload a file, the Micropub client sends a `multipart/form-data` request
 * with one part named `file`.
 */
export type Upload<
  V extends BaseValueUpload = BaseValueUpload,
  E extends Error = Error
> = (config: UploadConfig) => Promise<Result<E, V>>
