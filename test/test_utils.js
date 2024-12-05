import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { defFastify } from '../dist/app.js'
import { defConfig } from '../dist/config.js'
import { randomKid, sign } from '../dist/lib/token/index.js'

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
