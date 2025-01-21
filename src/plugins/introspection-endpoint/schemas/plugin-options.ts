import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer } from '@jackdbd/indieauth'
import { jwks_url } from '../../../lib/jwks/index.js'
import { ajv, report_all_ajv_errors } from '../../../lib/schemas/index.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '../../../lib/storage-api/index.js'
import { DEFAULT } from '../constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(ajv),

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    isAccessTokenRevoked,

    issuer,

    jwksUrl: jwks_url,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    // maxAccessTokenAge: Type.Optional(Type.String({ minLength: 1 })),

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
  isAccessTokenRevoked: IsAccessTokenRevoked
}
