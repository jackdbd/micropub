import { Type } from '@sinclair/typebox'

export const authorization_endpoint = Type.String({
  description: `URL of the authorization server's authorization endpoint.`,
  format: 'uri',
  title: 'Authorization endpoint'
})

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
 * @see [OAuth 2.0 Token Revocation (RFC7009)](https://datatracker.ietf.org/doc/html/rfc7009)
 */
export const revocation_endpoint = Type.String({
  description: `URL of the authorization server's OAuth 2.0 revocation endpoint.`,
  format: 'uri',
  title: 'Revocation endpoint'
})

export const token_endpoint = Type.String({
  description: `URL of the authorization server's token endpoint.`,
  format: 'uri',
  title: 'Token endpoint'
})
