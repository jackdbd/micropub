import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer } from '../../lib/indieauth/index.js'
import { authorization_endpoint } from '../../lib/oauth2/index.js'
import {
  addToIssuedTokens,
  type AddToIssuedTokens,
  jwks_private,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
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

    /**
     * Function that will be called to persist a token to some storage (e.g. a
     * database).
     */
    addToIssuedTokens,

    ajv: Type.Optional(Type.Any()),

    /**
     * Endpoint that will be called to verify an authorization code before
     * issuing a token.
     */
    authorizationEndpoint: Type.Optional({
      ...authorization_endpoint,
      default: DEFAULT.AUTHORIZATION_ENDPOINT
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
    })
  },
  {
    $id: 'fastify-token-endpoint-options',
    description: 'Options for the Fastify token-endpoint plugin',
    title: 'Fastify plugin token-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  addToIssuedTokens: AddToIssuedTokens
  ajv?: Ajv
}
