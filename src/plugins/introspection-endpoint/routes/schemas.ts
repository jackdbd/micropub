import { Static, Type } from '@sinclair/typebox'
import { me } from '../../../lib/indieauth/index.js'
import { exp, iat, iss, jti } from '../../../lib/jwt/index.js'
import {
  access_token,
  refresh_token,
  scope
} from '../../../lib/oauth2/index.js'

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
    me,
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
