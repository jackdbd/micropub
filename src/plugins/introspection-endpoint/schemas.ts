import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  issuer,
  me_after_url_canonicalization
} from '../../lib/indieauth/index.js'
import { exp, iat, iss, jti } from '../../lib/jwt/index.js'
import { jwks_url } from '../../lib/jwks/index.js'
import { access_token, refresh_token, scope } from '../../lib/oauth2/index.js'
import {
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    // accessTokenMaxAge: Type.Optional(Type.String({ default: DEFAULT.MAX_AGE })),

    ajv: Type.Optional(Type.Any()),

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    isAccessTokenBlacklisted,

    issuer,

    jwksUrl: jwks_url,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-introspection-endpoint-options',
    description: 'Options for the Fastify introspection-endpoint plugin',
    title: 'Fastify plugin introspection-endpoint options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
}

const active = Type.Boolean({
  description: `Boolean indicator of whether or not the presented token is currently active.`,
  title: 'active'
})

export const introspection_request_body = Type.Object(
  {
    token: Type.Union([access_token, refresh_token])
  },
  {
    $id: 'introspection-request-body',
    additionalProperties: false,
    description: 'The body sent by the client with a POST request.',
    title: 'introspect POST request'
  }
)

export type IntrospectionRequestBody = Static<typeof introspection_request_body>

/**
 * [Introspection Response](https://www.rfc-editor.org/rfc/rfc7662#section-2.2)
 */
export const introspection_response_body_success = Type.Object(
  {
    active,
    exp,
    iat,
    iss,
    jti,
    me: me_after_url_canonicalization,
    scope
  },
  {
    $id: 'introspection-response-body-success',
    additionalProperties: false,
    description:
      'The JSON response body that the server sends to a client upon receiving a valid POST request.',
    title: 'introspect POST response'
  }
)

export type IntrospectionResponseBodySuccess = Static<
  typeof introspection_response_body_success
>
