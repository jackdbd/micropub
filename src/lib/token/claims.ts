import type { JWTPayload } from 'jose'

/**
 * Claims in an access token.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7519#section-4
 */
export interface AccessTokenClaims extends JWTPayload {
  /**
   * (Expiration Time): Indicates the UNIX timestamp (in seconds) at which the
   * access token expires.
   */
  exp: number

  /**
   * (Issued At): Specifies the UNIX timestamp (in seconds) at which the access
   * token was issued.
   */
  iat: number

  /**
   * (Issuer): Specifies the issuer of the access token, typically the
   * authorization server.
   */
  iss: string

  /**
   * (JWT ID): A unique identifier for the access token. Useful for revoking the
   * token.
   */
  jti: string

  me: string

  /**
   * Space-separated list of permissions granted to the access token.
   */
  scope: string
}
