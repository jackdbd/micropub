import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer } from '../../lib/indieauth/index.js'
import {
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  jwks_url,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    // accessTokenMaxAge: Type.Optional(Type.String({ default: DEFAULT.MAX_AGE })),

    ajv: Type.Optional(Type.Any()),

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    isAccessTokenBlacklisted,

    issuer,

    jwksUrl: jwks_url,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-introspection-endpoint-options',
    description: 'Options for the Fastify introspection-endpoint plugin',
    title: 'Fastify plugin introspection-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
}
