import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  addToIssuedCodes,
  markCodeAsUsed,
  type AddToIssuedCodes,
  type MarkCodeAsUsed
} from '../../lib/authorization-code-storage-interface/index.js'
import { issuer } from '../../lib/indieauth/index.js'
import { report_all_ajv_errors } from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

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

    ajv: Type.Optional(Type.Any()),

    /**
     * Human-readable expiration time for the authorization code. It will be
     * shown in the consent screen.
     *
     * @example '60 seconds'
     */
    authorizationCodeExpiration: Type.String({ minLength: 1 }),

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
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
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
  ajv?: Ajv
  markAuthorizationCodeAsUsed: MarkCodeAsUsed
}
