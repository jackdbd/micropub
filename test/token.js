import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert'
import { secret, sign, decode } from '../dist/lib/token.js'

const __filename = fileURLToPath(import.meta.url)

describe('secret', () => {
  it('returns an error when the algorithm is not supported', async () => {
    const { error, value } = await secret({ alg: 'foo' })
    assert.ok(error)
    assert.ok(!value)
  })

  it('returns a value when the algorithm is supported', async () => {
    const { error, value } = await secret({ alg: 'HS256' })
    assert.ok(!error)
    assert.ok(value)
  })
})

describe('sign', () => {
  it('can issue a JWT', async () => {
    const algorithm = 'HS256'
    const expiration = '1 hour'
    const issuer = __filename
    const payload = { foo: 'bar' }
    const { value } = await secret({ alg: algorithm })

    const { error, value: jwt } = await sign({
      algorithm,
      expiration,
      issuer,
      payload,
      secret: value
    })

    assert.ok(!error)
    assert.ok(jwt)
  })
})

describe('decode', () => {
  it('can decode a JWT', async () => {
    const algorithm = 'HS256'
    const expiration = '1 hour'
    const issuer = __filename
    const payload = { foo: 'bar' }
    const { value } = await secret({ alg: algorithm })

    const { error, value: jwt } = await sign({
      algorithm,
      expiration,
      issuer,
      payload,
      secret: value
    })

    assert.ok(!error)
    assert.ok(jwt)

    const decoded = decode({ jwt })

    assert.strictEqual(decoded.foo, 'bar')
    assert.strictEqual(decoded.iss, issuer)
  })
})
