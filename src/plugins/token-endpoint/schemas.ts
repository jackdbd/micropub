import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer } from '../../lib/indieauth/index.js'
import { authorization_endpoint } from '../../lib/oauth2/index.js'
import {
  include_error_description,
  jwks_private,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  storeAccessToken,
  type StoreAccessToken
} from '../../lib/token-storage-interface/index.js'
import { DEFAULT } from './constants.js'

const access_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

const refresh_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

export const options = Type.Object(
  {
    /**
     * Human-readable expiration time for the access token. It will be shown in
     * the consent screen.
     *
     * @example '15 minutes'
     */
    accessTokenExpiration: Type.Optional({
      ...access_token_expiration,
      default: DEFAULT.ACCESS_TOKEN_EXPIRATION
    }),

    ajv: Type.Optional(Type.Any()),

    /**
     * Endpoint that will be called to verify an authorization code before
     * issuing a token.
     */
    authorizationEndpoint: Type.Optional({
      ...authorization_endpoint,
      default: DEFAULT.AUTHORIZATION_ENDPOINT
    }),

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    issuer,

    jwks: jwks_private,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    /**
     * Human-readable expiration time for the refresh token. It will be shown in
     * the consent screen.
     *
     * @example '30 days'
     */
    refreshTokenExpiration: Type.Optional({
      ...refresh_token_expiration,
      default: DEFAULT.REFRESH_TOKEN_EXPIRATION
    }),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    /**
     * Persists an access token to some storage (e.g. a database).
     */
    storeAccessToken
  },
  {
    $id: 'fastify-token-endpoint-options',
    description: 'Options for the Fastify token-endpoint plugin',
    title: 'Fastify plugin token-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  storeAccessToken: StoreAccessToken
}
