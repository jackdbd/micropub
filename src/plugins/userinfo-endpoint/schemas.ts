import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
// import type { Profile } from '../../lib/indieauth/schemas.js'
import type { RetrieveRecord } from '../../lib/storage-api/index.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),

  isAccessTokenRevoked,

  includeErrorDescription: Type.Optional(
    Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
  ),

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  // me,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  /**
   * Function that retrieves a user's profile from some storage.
   */
  retrieveProfile: Type.Any()
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenRevoked: IsAccessTokenRevoked
  retrieveProfile: RetrieveRecord // RetrieveRecord<Profile>
}
