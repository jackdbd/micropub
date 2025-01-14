import { Type, type Static } from '@sinclair/typebox'
import { jwks_private } from '../jwks/index.js'
import { iss } from '../jwt/index.js'
import { client_id, me_after_url_canonicalization } from '../indieauth/index.js'
import {
  access_token,
  expires_in,
  redirect_uri,
  refresh_token,
  scope
} from '../oauth2/index.js'

export const access_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

export const refresh_token_expiration = Type.String({
  description: `Human-readable expiration time for the access token issued by the token endpoint.`,
  minLength: 1,
  title: 'Access token expiration'
})

const DESCRIPTION = `Handler invoked when all preconditions to
issue an access token are met. Use it to persist the access token, and
optionally a refresh token, to your storage backend.`

const log_function_ = Type.Function([Type.String(), Type.Any()], Type.Void())

export type LogFunction = Static<typeof log_function_>

const log_function = Type.Any()

const logger = Type.Object({
  debug: log_function
})

export const config = Type.Object({
  access_token_expiration,
  client_id,
  issuer: iss,
  jwks: jwks_private,
  // jti,
  log: Type.Optional(logger),
  me: me_after_url_canonicalization,
  redirect_uri,
  refresh_token_expiration,
  scope
})

export type Config = Static<typeof config>

export const return_value = Type.Object({
  access_token,
  expires_in,
  me: me_after_url_canonicalization,
  refresh_token,
  scope
})

export type ReturnValue = Static<typeof return_value>

export const issueTokens_ = Type.Function(
  [config],
  Type.Promise(return_value),
  { title: 'issueTokens', description: DESCRIPTION }
)

export type IssueTokens = Static<typeof issueTokens_>

export const issueTokens = Type.Any({
  title: 'issueTokens',
  description: DESCRIPTION
})
