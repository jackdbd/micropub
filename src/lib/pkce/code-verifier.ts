import seedrandom from 'seedrandom'

export interface Config {
  len: number
  seed?: string
}

/**
 * Generates a plaintext random string of `len` characters, optionally using a seed.
 *
 * The client creates a code verifier for each authorization request by
 * generating a random string using the characters `[A-Z]` / `[a-z]` / `[0-9]` /
 * `-` / `.` / `_` / `~` with a minimum length of 43 characters and maximum
 * length of 128 characters. This value is stored on the client and will be used
 * in the authorization code exchange step later.
 *
 * TIP: setting a seed can be useful in tests.
 *
 * @see [Client Creates a Code Verifier - RFC7636](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1)
 * @see [Client Creates the Code Challenge - RFC7636](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2)
 * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 * @see [Online PKCE Generator Tool](https://tonyxu-io.github.io/pkce-generator/)
 */
export const codeVerifier = (config: Config) => {
  const { len, seed } = config

  const rng = seedrandom(seed)

  // The code verifier will be part of the URL, so we need to use characters
  // that can be used in a URI (unreserved characters).
  // https://datatracker.ietf.org/doc/html/rfc3986#section-2.3
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  let str = ''
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(rng() * charset.length)
    str += charset[idx]
  }

  return str
}
