import { Static, Type } from '@sinclair/typebox'

/**
 * Authorization code generated by the authorization endpoint.
 *
 * The code MUST expire shortly after it is issued to mitigate the risk of
 * leaks, and MUST be valid for only one use.
 * A maximum lifetime of 10 minutes is recommended.
 *
 * @see [Authorization Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
 */
export const authorization_code = Type.String({
  minLength: 1,
  description:
    'The authorization code generated by the authorization endpoint. The code MUST expire shortly after it is issued to mitigate the risk of leaks, and MUST be valid for only one use. A maximum lifetime of 10 minutes is recommended. See [Authorization Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2).'
})

export const authorization_endpoint = Type.String({
  description: `URL of the authorization server's authorization endpoint.`,
  format: 'uri',
  title: 'Authorization endpoint'
})

/**
 * OAuth 2.0 grant_type string that the client can use at the token endpoint.
 *
 * @see [Relationship between Grant Types and Response Types - OAuth 2.0 Dynamic Client Registration Protocol (RFC7591)](https://datatracker.ietf.org/doc/html/rfc7591#section-2.1)
 */
export const grant_type = Type.Union(
  [
    Type.Literal('authorization_code'),
    Type.Literal('implicit'),
    Type.Literal('password'),
    Type.Literal('client_credentials'),
    Type.Literal('refresh_token'),
    Type.Literal('urn:ietf:params:oauth:grant-type:jwt-bearer'),
    Type.Literal('urn:ietf:params:oauth:grant-type:saml2-bearer')
  ],
  {
    description:
      'OAuth 2.0 grant_type string that the client can use at the token endpoint.'
  }
)

/**
 * @see [OAuth 2.0 Token Introspection (RFC7662)](https://www.rfc-editor.org/rfc/rfc7662)
 */
export const introspection_endpoint = Type.String({
  description: `URL of the authorization server's OAuth 2.0 introspection endpoint.`,
  format: 'uri',
  title: 'Introspection endpoint'
})

export const redirect_uri = Type.String({
  description:
    'Holds a URL. A successful response from this endpoint results in a redirect to this URL.',
  format: 'uri'
})

/**
 * Parameter that tells the Authorization Server which mechanism to use for
 * returning Authorization Response parameters from the Authorization Endpoint.
 *
 * @see [Response Modes - OAuth 2.0 Multiple Response Type Encoding Practices](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes)
 */
export const response_mode = Type.Union(
  [Type.Literal('fragment'), Type.Literal('query')],
  {
    $id: 'oauth-2.0-response-mode',
    description: `OAuth 2.0 response_mode. See [Response Modes - OAuth 2.0 Multiple Response Type Encoding Practices](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes).`
  }
)

/**
 * OAuth 2.0 response_type string that a client can use at the authorization
 * endpoint.
 *
 * - `code`: The authorization code response type defined in [OAuth 2.0, Section 4.1](https://datatracker.ietf.org/doc/html/rfc7591#section-4.1).
 * - `token`: The implicit response type defined in [OAuth 2.0, Section 4.2](https://datatracker.ietf.org/doc/html/rfc7591#section-4.2).
 *
 * @see [Relationship between Grant Types and Response Types - OAuth 2.0 Dynamic Client Registration Protocol (RFC7591)](https://datatracker.ietf.org/doc/html/rfc7591#section-2.1)
 */
export const response_type = Type.Union(
  [Type.Literal('code'), Type.Literal('token')],
  {
    $id: 'oauth-2.0-response-type',
    description: 'Tells the authorization server which grant to execute.'
  }
)

export type OAuthResponseType = Static<typeof response_type>

/**
 * @see [OAuth 2.0 Token Revocation (RFC7009)](https://datatracker.ietf.org/doc/html/rfc7009)
 */
export const revocation_endpoint = Type.String({
  description: `URL of the authorization server's OAuth 2.0 revocation endpoint.`,
  format: 'uri',
  title: 'Revocation endpoint'
})

export const scope = Type.String({
  description: `Scope values. See [RFC8693 scope claim](https://www.rfc-editor.org/rfc/rfc8693.html#name-scope-scopes-claim)`,
  minLength: 1,
  title: 'Scope (scopes) claim'
})

export const state = Type.String({
  $id: 'oauth-2.0-state',
  description:
    'An opaque value used by the client to maintain state between the request and callback. The parameter SHOULD be used for preventing cross-site request forgery. See [OAuth 2.0 Authorization Request](https://www.rfc-editor.org/rfc/rfc6749#section-4.1.1).',
  minLength: 1
})

export const token_endpoint = Type.String({
  description: `URL of the authorization server's token endpoint.`,
  format: 'uri',
  title: 'Token endpoint'
})
