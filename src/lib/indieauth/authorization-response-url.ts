import crypto from 'node:crypto'

export interface Config {
  iss?: string
  redirect_uri: string
  state: string
}

export type AuthResponseQuery = Omit<Config, 'redirect_uri'>

/**
 * Builds the URL for the authorization callback.
 *
 * If the user approves the request, the authorization endpoint generates an
 * authorization code and builds the redirect back to the client.
 *
 * The redirect is built by starting with the `redirect_uri` in the request, and
 * adding the following parameters to the query component of the redirect URL:
 *
 * - `code`: The authorization code generated by the authorization endpoint. The
 *   code MUST expire shortly after it is issued to mitigate the risk of leaks, and MUST be valid for only one use.
 *   A maximum lifetime of 10 minutes is recommended.
 * - `state`: The state parameter MUST be set to the exact value that the client
 *   set in the request.
 * - `iss`: The issuer identifier for client validation. This is optional in
 *   OAuth 2.0 servers, but required in IndieAuth servers. See also the
 *   `authorization_response_iss_parameter_supported` parameter in
 *   [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata).
 *
 * @see [Authorization Response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [Authorization Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
 */
export const authorizationResponseUrl = (config: Config) => {
  const { iss, redirect_uri, state } = config

  // 16 bytes of binary data => 32 hexadecimal characters
  const code = crypto.randomBytes(16).toString('hex')

  const query = { code, iss, state }

  const qs = Object.entries(query).reduce((acc, [key, value]) => {
    return value ? `${acc}&${key}=${encodeURIComponent(value)}` : acc
  }, '')

  return { redirect_url: `${redirect_uri}?${qs}`, code, iss, state }
}