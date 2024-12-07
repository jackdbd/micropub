import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { defFastify } from '../dist/app.js'
import { defConfig } from '../dist/config.js'
import { randomKid, safeDecode, sign } from '../dist/lib/token/index.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename
export const DEFAULT_EXPIRATION = '5 minutes'

const jwks_private = process.env.JWKS
if (!jwks_private) {
  throw new Error('JWKS not set')
}
export const JWKS = JSON.parse(jwks_private)

export const JWKS_URL = new URL(
  'https://content.giacomodebidda.com/misc/jwks-public.json'
)

export const defTestApp = async () => {
  const { error, value: config } = await defConfig()
  if (error) {
    console.error(error)
  }
  assert.ok(!error)
  const app = await defFastify(config)
  return app
}

export const issueJWT = async (payload = {}) => {
  const { error: kid_error, value: kid } = randomKid(JWKS.keys)
  assert.ok(!kid_error)

  const expiration = DEFAULT_EXPIRATION
  const issuer = DEFAULT_ISSUER

  const { error, value: jwt } = await sign({
    expiration,
    issuer,
    jwks: JWKS,
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
