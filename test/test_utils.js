import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { defFastify } from '../dist/app.js'
import { defConfig } from '../dist/config.js'
import * as DEFAULT from '../dist/defaults.js'
import { randomKid, safeDecode, sign } from '../dist/lib/token/index.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename
export const DEFAULT_EXPIRATION = '5 minutes'

// In some environments (e.g. Fly.io) we need to set JWKS as an escaped JSON
// string (e.g. "{\"keys\":[]}"). So in those environments we need to call
// JSON.parse twice to build the actual JS object.
let jwks = JSON.parse(DEFAULT.JWKS)
if (typeof jwks === 'string') {
  jwks = JSON.parse(jwks)
}
export { jwks }

export const jwks_url = new URL(DEFAULT.JWKS_PUBLIC_URL)

export const defTestApp = async () => {
  const config = await defConfig()
  return await defFastify(config)
}

export const issueJWT = async (payload = {}) => {
  const { error: kid_error, value: kid } = randomKid(jwks.keys)
  assert.ok(!kid_error)

  const expiration = DEFAULT_EXPIRATION
  const issuer = DEFAULT_ISSUER

  const { error, value: jwt } = await sign({
    expiration,
    issuer,
    jwks,
    kid,
    payload
  })
  assert.ok(!error)
  assert.ok(jwt)

  return { expiration, issuer, jwt }
}

export const REQUIRED_CLAIMS = ['exp', 'iat', 'iss', 'jti']

export const assertTokenHasRequiredClaims = async (jwt) => {
  const { error, value: claims } = await safeDecode(jwt)

  assert.ok(!error)

  REQUIRED_CLAIMS.forEach((claim) => {
    assert.ok(claims[claim])
  })
}

export const assertTokenHasRequiredAndCustomClaims = async (jwt, custom) => {
  const { error, value: claims } = await safeDecode(jwt)

  assert.ok(!error)

  REQUIRED_CLAIMS.forEach((claim) => {
    assert.ok(claims[claim])
  })

  Object.entries(custom).forEach(([claim, value]) => {
    assert.strictEqual(claims[claim], value)
  })
}

export const defTotalBlacklisted = (isBlacklisted) => {
  return async function totalBlacklisted(jtis) {
    const results = await Promise.all(jtis.map((jti) => isBlacklisted(jti)))

    const errors = results.map((r) => r.error).filter((x) => x !== undefined)

    assert.ok(
      errors.length === 0,
      `${errors.length} results of totalBlacklisted() are errors`
    )

    const arr = results.map((r) => r.value).filter((x) => x === true)
    return arr.length
  }
}

export const waitMs = (ms) => {
  let timeout
  return new Promise((resolve) => {
    timeout = setTimeout(() => {
      resolve()
      clearTimeout(timeout)
    }, ms)
  })
}
