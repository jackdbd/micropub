import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { report_all_ajv_errors } from '../../schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  logPrefix: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.LOG_PREFIX })
  ),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  scope: Type.String({ minLength: 1 })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
}
