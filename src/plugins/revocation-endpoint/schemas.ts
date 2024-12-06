import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  isBlacklisted,
  me,
  report_all_ajv_errors,
  revoke
} from '../../lib/schemas/index.js'
import type { IsBlacklisted, Revoke } from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object({
  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
  }),
  isBlacklisted,
  me,
  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT_REPORT_ALL_AJV_ERRORS
  }),
  revoke
})

export interface Options extends Static<typeof options> {
  isBlacklisted: IsBlacklisted
  revoke: Revoke
}
