import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { ajv, report_all_ajv_errors } from '../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(ajv),

  goBackHref: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.GO_BACK_HREF })
  ),

  goBackName: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.GO_BACK_NAME })
  ),

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
}
