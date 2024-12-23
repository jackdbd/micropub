import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer, me } from '../../lib/indieauth/index.js'
import {
  isBlacklisted,
  type IsBlacklisted,
  jwks_url,
  markTokenAsRevoked,
  type MarkTokenAsRevoked,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  isBlacklisted,

  issuer,

  jwksUrl: jwks_url,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  markTokenAsRevoked,

  maxTokenAge: Type.String({ minLength: 1 }),

  me,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isBlacklisted: IsBlacklisted
  markTokenAsRevoked: MarkTokenAsRevoked
}
