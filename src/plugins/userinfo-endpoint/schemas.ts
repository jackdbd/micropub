import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  info,
  isBlacklisted,
  me,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import type { IsBlacklisted } from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

const store = Type.Object({
  info,
  isBlacklisted
})

export interface Store extends Static<typeof store> {
  isBlacklisted: IsBlacklisted
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
  store
})

export type Options = Static<typeof options>
