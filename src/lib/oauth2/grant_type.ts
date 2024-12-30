import { Static, Type } from '@sinclair/typebox'

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

export type GrantType = Static<typeof grant_type>
