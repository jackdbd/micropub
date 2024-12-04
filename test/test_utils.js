import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { secret, sign } from '../dist/lib/token.js'

const __filename = fileURLToPath(import.meta.url)

export const issueJWT = async (payload = {}) => {
  const algorithm = payload.algorithm || 'HS256'
  const expiration = payload.expiration || '1 hour'
  const issuer = __filename

  const { value: key } = await secret({ alg: algorithm })

  const { value: jwt } = await sign({
    algorithm,
    expiration,
    issuer,
    payload,
    secret: key
  })

  assert.ok(expiration)
  assert.ok(issuer)
  assert.ok(jwt)
  assert.ok(key)

  return { expiration, issuer, jwt, secret: key }
}
