import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  me,
  get,
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

export const options = Type.Object({
  get,
  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
  }),
  isBlacklisted,
  me,
  publishedUrlToStoreLocation,
  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT_REPORT_ALL_AJV_ERRORS
  }),
  syndicators: Type.Any(),
  update
})

export interface Options extends Static<typeof options> {
  get: Get
  isBlacklisted: IsBlacklisted
  publishedUrlToStoreLocation: PublishedUrlToStoreLocation
  update: Update
}
