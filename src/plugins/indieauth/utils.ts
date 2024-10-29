import { createHash } from 'node:crypto'
import seedrandom from 'seedrandom'

interface CodeVerifierConfig {
  len: number
  seed?: string
}

/**
 * Generates a plaintext random string.
 *
 * Optionally pass a seed (useful in tests).
 *
 * The IndieAuth client creates a code verifier for each authorization request
 * by generating a random string using the characters
 * [A-Z] / [a-z] / [0-9] / - / . / _ / ~ with a minimum length of 43 characters
 * and maximum length of 128 characters. This value is stored on the client and
 * will be used in the authorization code exchange step later.
 *
 * See: https://indieauth.spec.indieweb.org/#request
 */
export const codeVerifier = ({ seed, len }: CodeVerifierConfig) => {
  const rng = seedrandom(seed)

  // ASCII character set (printable characters)
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  let str = ''
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(rng() * charset.length)
    str += charset[idx]
  }

  return str
}

interface CodeChallengeConfig {
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
export const codeChallenge = ({
  code_challenge_method,
  code_verifier
}: CodeChallengeConfig) => {
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
