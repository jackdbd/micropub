import type Ajv from 'ajv'
import { Static, Type } from '@sinclair/typebox'
import { report_all_ajv_errors } from '../../schemas/flags.js'
import type { IsBlacklisted } from '../../schemas/is-blacklisted.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  accessTokenSessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.ACCESS_TOKEN_SESSION_KEY })
  ),

  ajv: Type.Optional(Type.Any()),

  header: Type.Optional(Type.String({ minLength: 1, default: DEFAULT.HEADER })),

  headerKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.HEADER_KEY })
  ),

  isBlacklisted: Type.Any(),

  key_in_session: Type.Optional(Type.String({ default: 'access_token' })),

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
  isBlacklisted: IsBlacklisted
}
