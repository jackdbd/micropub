import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { me } from '../../lib/indieauth/index.js'
import {
  get,
  type Get,
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  publishedUrlToStorageLocation,
  type PublishedUrlToStorageLocation,
  report_all_ajv_errors,
  update,
  type Update
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

// import type { Syndicator } from '../../lib/micropub/index.js'
// syndicators: { [uid: string]: Syndicator }

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  get,

  includeErrorDescription: Type.Optional(
    Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
  ),

  isAccessTokenBlacklisted,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  me,

  publishedUrlToStorageLocation,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  syndicators: Type.Any(),

  update
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  get: Get
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  publishedUrlToStorageLocation: PublishedUrlToStorageLocation
  update: Update
}
