import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { me } from '../../lib/indieauth/index.js'
import {
  isBlacklisted,
  type IsBlacklisted,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  isBlacklisted,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  me,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isBlacklisted: IsBlacklisted
}
