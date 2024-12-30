import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  markAuthorizationCodeAsUsed,
  retrieveAuthorizationCode,
  storeAuthorizationCode,
  type MarkAuthorizationCodeAsUsed,
  type StoreAuthorizationCode,
  type RetrieveAuthorizationCode
} from '../../lib/authorization-code-storage-interface/index.js'
import { issuer } from '../../lib/indieauth/index.js'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

// I am torn about including, in the consent screen, the expiration times for
// the access token and the refresh token. Showing their expiration times in the
// consent screen implies that the authorization endpoint has some knowledge
// about the token endpoint.

export const options = Type.Object(
  {
    /**
     * Human-readable expiration time for the access token. It will be shown in
     * the consent screen.
     *
     * @example '15 minutes'
     */
    // accessTokenExpiration: Type.String({ minLength: 1 }),

    /**
     * AJV instance, for validation.
     */
    ajv: Type.Optional(Type.Any()),

    /**
     * Human-readable expiration time for the authorization code. It will be
     * shown in the consent screen.
     *
     * @example '60 seconds'
     */
    authorizationCodeExpiration: Type.String({
      default: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
      minLength: 1
    }),

    /**
     * Whether to include an `error_description` property in all error responses.
     */
    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    /**
     * Issuer identifier. This is optional in OAuth 2.0 servers, but required in
     * IndieAuth servers.
     *
     * See also the `authorization_response_iss_parameter_supported` parameter in
     * [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata).
     */
    issuer: Type.Optional(issuer),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    /**
     * Function that marks as used a previously generated authorization code (an
     * authorization code should be single-use only).
     */
    markAuthorizationCodeAsUsed,

    redirectUrlOnDeny: Type.Optional(
      Type.String({
        default: DEFAULT.REDIRECT_URL_ON_DENY,
        minLength: 1
      })
    ),

    /**
     * Human-readable expiration time for the refresh token. It will be shown in
     * the consent screen.
     *
     * @example '30 days'
     */
    // refreshTokenExpiration: Type.String({ minLength: 1 }),

    /**
     * Whether to include all AJV errors when validation fails.
     */
    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    /**
     * Function that retrieves an authorization code from some storage.
     */
    retrieveAuthorizationCode,

    /**
     * Function that persists an authorization code to some storage (e.g. a
     * database).
     */
    storeAuthorizationCode
  },
  {
    $id: 'fastify-authorization-endpoint-options',
    description: 'Options for the Fastify authorization-endpoint plugin',
    title: 'Fastify plugin authorization-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  markAuthorizationCodeAsUsed: MarkAuthorizationCodeAsUsed
  retrieveAuthorizationCode: RetrieveAuthorizationCode
  storeAuthorizationCode: StoreAuthorizationCode
}
