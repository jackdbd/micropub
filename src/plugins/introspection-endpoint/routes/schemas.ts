import { Static, Type } from '@sinclair/typebox'
import { exp, iat, iss, jti, me } from '../../../lib/schemas/index.js'
import { scope } from '../../../lib/oauth2/index.js'

const active = Type.Boolean({
  description: `Boolean indicator of whether or not the presented token is currently active.`,
  title: 'active'
})

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
