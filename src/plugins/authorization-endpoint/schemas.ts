import { Static, Type } from '@sinclair/typebox'
import {
  addToIssuedCodes,
  markCodeAsUsed,
  type AddToIssuedCodes,
  type MarkCodeAsUsed
} from '../../lib/authorization-code-storage-interface/index.js'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

// TODO: I am not sure it's a good idea to show the expiration times for the
// access token and the refresh token, because they are set by the token
// endpoint. Showing their expiration times in the consent screen implies that
// this authorization endpoint has some knowledge about the token endpoint.

export const options = Type.Object(
  {
    /**
     * Human-readable expiration time for the access token. It will be shown in
     * the consent screen.
     *
     * @example '15 minutes'
     */
    accessTokenExpiration: Type.String({ minLength: 1 }),

    /**
     * Function that will be called to persist an authorization code to some
     * storage (e.g. a database).
     */
    addToIssuedCodes,

    /**
     * Human-readable expiration time for the authorization code. It will be
     * shown in the consent screen.
     *
     * @example '60 seconds'
     */
    authorizationCodeExpiration: Type.String({ minLength: 1 }),

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
    }),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    /**
     * Function that will be called to mark a previously generated authorization
     * code as used (an authorization code should be single-use only).
     */
    markAuthorizationCodeAsUsed: markCodeAsUsed,

    /**
     * Human-readable expiration time for the refresh token. It will be shown in
     * the consent screen.
     *
     * @example '30 days'
     */
    refreshTokenExpiration: Type.String({ minLength: 1 }),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-authorization-endpoint-options',
    description: 'Options for the Fastify authorization-endpoint plugin',
    title: 'Fastify plugin authorization-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  addToIssuedCodes: AddToIssuedCodes
  markAuthorizationCodeAsUsed: MarkCodeAsUsed
}
