import { Static, Type } from '@sinclair/typebox'
import {
  addToIssuedTokens,
  include_error_description,
  isBlacklisted,
  iss,
  issueJWT,
  jwks_private,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import type {
  AddToIssuedTokens,
  IsBlacklisted,
  IssueJWT
} from '../../lib/schemas/index.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

const authorization_endpoint = Type.String({
  format: 'uri',
  title: 'authorization endpoint'
})

const expiration = Type.String({
  default: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  description: `Token expiration`,
  minLength: 1,
  title: 'JWT expiration'
})

export const options = Type.Object(
  {
    addToIssuedTokens,
    authorizationEndpoint: Type.Optional({
      ...authorization_endpoint,
      default: DEFAULT_AUTHORIZATION_ENDPOINT
    }),
    expiration,
    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
    }),
    isBlacklisted,
    issuer: iss,
    jwks: jwks_private,
    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
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
  isBlacklisted: IsBlacklisted
}

export const token_post_config = Type.Object({
  authorization_endpoint,
  include_error_description,
  issueJWT,
  log_prefix: Type.String()
})

export interface TokenPostConfig extends Static<typeof token_post_config> {
  issueJWT: IssueJWT
}
