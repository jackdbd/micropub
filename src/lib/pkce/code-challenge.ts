import { createHash } from 'node:crypto'

export interface Config {
  /**
   * The original plaintext random string generated before starting the
   * authorization request.
   */
  code_verifier: string

  /**
   * The hashing method to use in the code challenge.
   * It must be a method supported by the authorization server.
   * If the client is capable of using `"S256"`, it MUST use `"S256"`, as
   * `"S256"` is Mandatory To Implement (MTI) on the server.
   */
  method: string
}

/**
 * Generates a code challenge for the Proof Key for Code Exchange flow (PKCE).
 *
 * @see [Client Creates the Code Challenge - RFC7636](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2)
 * @see [Authorization Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-request)
 * @see [Online PKCE Generator Tool](https://tonyxu-io.github.io/pkce-generator/)
 */
export const codeChallenge = (config: Config) => {
  const { method, code_verifier } = config

  switch (method) {
    case 'plain': {
      return code_verifier
    }
    case 'S256': {
      // Pseudocode:
      // code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
      return createHash('sha256').update(code_verifier).digest('base64url')
    }
    default:
      throw new Error(`Unsupported PKCE code challenge method: ${method}`)
  }
}
