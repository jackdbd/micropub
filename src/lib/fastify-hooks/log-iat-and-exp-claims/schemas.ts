import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { report_all_ajv_errors } from '../../schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  claimsSessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.CLAIMS_SESSION_KEY })
  ),

  logPrefix: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.LOG_PREFIX })
  ),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  sessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.SESSION_KEY })
  )
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
}
