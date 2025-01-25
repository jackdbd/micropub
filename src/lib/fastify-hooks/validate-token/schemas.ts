import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '@jackdbd/fastify-token-endpoint'
import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { ajv, report_all_ajv_errors } from '../../schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  accessTokenSessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.ACCESS_TOKEN_SESSION_KEY })
  ),

  ajv: Type.Optional(ajv),

  header: Type.Optional(Type.String({ minLength: 1, default: DEFAULT.HEADER })),

  headerKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.HEADER_KEY })
  ),

  isAccessTokenRevoked: isAccessTokenRevoked,

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
  isAccessTokenRevoked: IsAccessTokenRevoked
}
