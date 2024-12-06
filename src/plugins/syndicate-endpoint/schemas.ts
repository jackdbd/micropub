import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  me,
  get,
  info,
  isBlacklisted,
  publishedUrlToStoreLocation,
  report_all_ajv_errors,
  update
} from '../../lib/schemas/index.js'
import type {
  Get,
  IsBlacklisted,
  PublishedUrlToStoreLocation,
  Update
} from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

// import type { Syndicator } from '../../lib/micropub/index.js'
// syndicators: { [uid: string]: Syndicator }

const store = Type.Object({
  get,
  info,
  isBlacklisted,
  publishedUrlToStoreLocation,
  update
})

export interface Store extends Static<typeof store> {
  get: Get
  isBlacklisted: IsBlacklisted
  publishedUrlToStoreLocation: PublishedUrlToStoreLocation
  update: Update
}

export const options = Type.Object({
  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
  }),
  me,
  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT_REPORT_ALL_AJV_ERRORS
  }),
  store,
  syndicators: Type.Any()
})

export type Options = Static<typeof options>
