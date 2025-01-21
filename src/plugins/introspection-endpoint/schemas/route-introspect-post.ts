import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { issuer, me_after_url_canonicalization } from '@jackdbd/indieauth'
import { exp, iat, iss, jti } from '../../../lib/jwt/index.js'
import { jwks_url } from '../../../lib/jwks/index.js'
import { access_token, refresh_token, scope } from '@jackdbd/oauth2'
import { ajv, include_error_description } from '../../../lib/schemas/index.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '../../../lib/storage-api/index.js'
import { DEFAULT } from '../constants.js'

const active = Type.Boolean({
  description: `Boolean indicator of whether or not the presented token is currently active.`,
  title: 'active'
})

export const config = Type.Object(
  {
    ajv,
    include_error_description,
    isAccessTokenRevoked,
    issuer,
    jwks_url,
    log_prefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX }))
    // max_access_token_age: Type.String({ minLength: 1 })
  },
  {
    additionalProperties: false,
    $id: 'introspection-endpoint-post-method-config'
  }
)

export interface Config extends Static<typeof config> {
  ajv: Ajv
  isAccessTokenRevoked: IsAccessTokenRevoked
}

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
