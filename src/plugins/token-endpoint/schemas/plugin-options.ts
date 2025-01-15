import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../../lib/schemas/index.js'
import { issuer, userinfo_endpoint } from '../../../lib/indieauth/index.js'
import { expiration } from '../../../lib/issue-tokens/index.js'
import { jwks_private } from '../../../lib/jwks/index.js'
import {
  authorization_endpoint,
  revocation_endpoint
} from '../../../lib/oauth2/index.js'
import { DEFAULT } from '../constants.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from './is-access-token-revoked.js'
import { onIssuedTokens, type OnIssuedTokens } from './on-issued-tokens.js'
import {
  retrieveRefreshToken,
  type RetrieveRefreshToken
} from './retrieve-refresh-token.js'

export const options = Type.Object(
  {
    /**
     * Human-readable expiration time for the access token. It will be shown in
     * the consent screen.
     *
     * @example '15 minutes'
     */
    accessTokenExpiration: Type.Optional({
      ...expiration,
      default: DEFAULT.ACCESS_TOKEN_EXPIRATION
    }),

    ajv: Type.Optional(Type.Any()),

    /**
     * Endpoint that will be called to verify an authorization code before
     * issuing a token.
     */
    authorizationEndpoint: authorization_endpoint,

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    /**
     * Predicate function that will be called to check whether a previously
     * issued token is revoked or not.
     */
    isAccessTokenRevoked,

    issuer,

    jwks: jwks_private,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    onIssuedTokens,

    /**
     * Human-readable expiration time for the refresh token. It will be shown in
     * the consent screen.
     *
     * @example '30 days'
     */
    refreshTokenExpiration: Type.Optional({
      ...expiration,
      default: DEFAULT.REFRESH_TOKEN_EXPIRATION
    }),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    retrieveRefreshToken,

    revocationEndpoint: revocation_endpoint,

    userinfoEndpoint: userinfo_endpoint
  },
  {
    $id: 'fastify-token-endpoint-options',
    description: 'Options for the Fastify token-endpoint plugin',
    title: 'Fastify plugin token-endpoint options'
  }
)

/**
 * Options for the Fastify token-endpoint plugin.
 */
export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenRevoked: IsAccessTokenRevoked
  onIssuedTokens: OnIssuedTokens
  retrieveRefreshToken: RetrieveRefreshToken
}
