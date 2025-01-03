import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
// import { me_after_url_canonicalization } from '../../lib/indieauth/index.js'
import {
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  isAccessTokenBlacklisted,

  includeErrorDescription: Type.Optional(
    Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
  ),

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  // me,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
}
