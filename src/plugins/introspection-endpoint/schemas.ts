import { Static, Type } from '@sinclair/typebox'
import {
  exp,
  iat,
  include_error_description,
  isBlacklisted,
  iss,
  jwks_url,
  jti,
  me,
  report_all_ajv_errors,
  scope
} from '../../lib/schemas/index.js'
import type { IsBlacklisted } from '../../lib/schemas/index.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

const active = Type.Boolean({
  description: `Boolean indicator of whether or not the presented token is currently active.`,
  title: 'active'
})

const expiration = Type.String({
  default: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  description: `Token expiration`,
  minLength: 1,
  title: 'JWT expiration'
})

export const options = Type.Object(
  {
    expiration,
    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
    }),
    isBlacklisted,
    issuer: iss,
    jwks_url,
    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-introspection-endpoint-options',
    description: 'Options for the Fastify introspection-endpoint plugin',
    title: 'Fastify plugin introspection-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  isBlacklisted: IsBlacklisted
}

export const introspect_post_request_body = Type.Object(
  {
    token: Type.String({ minLength: 1 })
  },
  {
    $id: 'introspect-post-request',
    // additionalProperties: true,
    additionalProperties: false,
    description: 'The body sent by the client with a POST request.',
    title: 'introspect POST request'
  }
)

export type IntrospectPostRequestBody = Static<
  typeof introspect_post_request_body
>

export const introspect_post_response_body = Type.Object(
  {
    active,
    exp,
    iat,
    iss,
    jti,
    me,
    scope
  },
  {
    $id: 'introspect-post-response',
    // additionalProperties: true,
    additionalProperties: false,
    description:
      'The JSON response body that the server sends to a client upon receiving a valid POST request.',
    title: 'introspect POST response'
  }
)

export type IntrospectPostResponseBody = Static<
  typeof introspect_post_response_body
>
