import { Static, Type } from '@sinclair/typebox'
import { issuer, me } from '../../lib/indieauth/index.js'
import {
  include_error_description,
  isBlacklisted,
  jwks_url,
  markTokenAsRevoked,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import type {
  IsBlacklisted,
  MarkTokenAsRevoked
} from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object({
  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
  }),

  isBlacklisted,

  issuer,

  jwksUrl: jwks_url,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

  markTokenAsRevoked,

  maxTokenAge: Type.String({ minLength: 1 }),

  me,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT_REPORT_ALL_AJV_ERRORS
  })
})

export interface Options extends Static<typeof options> {
  isBlacklisted: IsBlacklisted
  markTokenAsRevoked: MarkTokenAsRevoked
}
