import { Static, Type } from '@sinclair/typebox'
import { issuer } from '../../lib/indieauth/index.js'
import {
  include_error_description,
  isBlacklisted,
  jwks_url,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import type { IsBlacklisted } from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object(
  {
    // accessTokenMaxAge: Type.Optional(Type.String({ default: DEFAULT_MAX_AGE })),

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
    }),

    isBlacklisted,

    issuer,

    jwksUrl: jwks_url,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-introspection-endpoint-options',
    description: 'Options for the Fastify introspection-endpoint plugin',
    title: 'Fastify plugin introspection-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  isBlacklisted: IsBlacklisted
}
