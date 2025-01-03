import { Type } from '@sinclair/typebox'

/**
 * OAuth 2.0 authorization endpoint.
 *
 * @see [Authorization Endpoint - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)
 */
export const authorization_endpoint = Type.String({
  description: `URL of the authorization server's authorization endpoint.`,
  format: 'uri',
  title: 'Authorization endpoint'
})

/**
 * OAuth 2.0 token introspection endpoint.
 *
 * @see [OAuth 2.0 Token Introspection (RFC 7662)](https://www.rfc-editor.org/rfc/rfc7662)
 */
export const introspection_endpoint = Type.String({
  description: `URL of the authorization server's OAuth 2.0 introspection endpoint.`,
  format: 'uri',
  title: 'Introspection endpoint'
})

/**
 * OAuth 2.0 token revocation endpoint.
 * @see [OAuth 2.0 Token Revocation (RFC 7009)](https://datatracker.ietf.org/doc/html/rfc7009)
 */
export const revocation_endpoint = Type.String({
  description: `URL of the authorization server's OAuth 2.0 revocation endpoint.`,
  format: 'uri',
  title: 'Revocation endpoint'
})

/**
 * OAuth 2.0 token endpoint.
 *
 * @see [Token Endpoint - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.2)
 */
export const token_endpoint = Type.String({
  description: `URL of the authorization server's token endpoint.`,
  format: 'uri',
  title: 'Token endpoint'
})
