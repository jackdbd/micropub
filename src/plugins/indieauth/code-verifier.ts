import seedrandom from 'seedrandom'

interface Config {
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
export const codeVerifier = ({ seed, len }: Config) => {
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
