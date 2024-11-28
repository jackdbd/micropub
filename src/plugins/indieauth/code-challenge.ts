import { createHash } from 'node:crypto'

interface Config {
  code_verifier: string
  code_challenge_method: string
}

/**
 * Generates a PKCE code challenge using the code_verifier and a code_challenge_method.
 *
 * The IndieAuth client creates the code challenge derived from the code
 * verifier by calculating the SHA256 hash of the code verifier and
 * Base64-URL-encoding the result.
 *
 * ```
 * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 * ```
 *
 * See: https://indieauth.spec.indieweb.org/#authorization-request
 */
export const codeChallenge = (config: Config) => {
  const { code_challenge_method, code_verifier } = config
  let alg = ''
  switch (code_challenge_method) {
    case 'S256':
      alg = 'sha256'
      break
    default:
      throw new Error(
        `Unsupported code_challenge_method: ${code_challenge_method}`
      )
  }
  return createHash(alg).update(code_verifier).digest('base64url')
}
