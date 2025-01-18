import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  ajv,
  include_error_description,
  report_all_ajv_errors
} from '../../../lib/schemas/index.js'
import {
  issuer,
  me_after_url_canonicalization,
  me_before_url_canonicalization
} from '../../../lib/indieauth/index.js'
import { jwks_url } from '../../../lib/jwks/index.js'
import {
  isAccessTokenRevoked,
  retrieveRefreshToken,
  retrieveAccessToken,
  revokeAccessToken,
  revokeRefreshToken
} from '../../../lib/storage-api/index.js'
import type {
  IsAccessTokenRevoked,
  RetrieveAccessToken,
  RetrieveRefreshToken,
  RevokeAccessToken,
  RevokeRefreshToken
} from '../../../lib/storage-api/index.js'
import { DEFAULT } from '../constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(ajv),

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    isAccessTokenRevoked,

    issuer,

    jwksUrl: jwks_url,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    maxAccessTokenAge: Type.Optional(Type.String({ minLength: 1 })),

    me: Type.Union([
      me_before_url_canonicalization,
      me_after_url_canonicalization
    ]),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    retrieveAccessToken,

    retrieveRefreshToken,

    revokeAccessToken,

    revokeRefreshToken
  },
  {
    $id: 'fastify-revocation-endpoint-options',
    description: 'Options for the Fastify revocation-endpoint plugin',
    title: 'Revocation Endpoint Options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenRevoked: IsAccessTokenRevoked
  retrieveAccessToken: RetrieveAccessToken
  retrieveRefreshToken: RetrieveRefreshToken
  revokeAccessToken: RevokeAccessToken
  revokeRefreshToken: RevokeRefreshToken
}
