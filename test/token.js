import assert from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { unixTimestampInSeconds } from '../dist/lib/date.js'
import {
  decode,
  isExpired,
  safeDecode,
  secret,
  sign,
  verify
} from '../dist/lib/token.js'
import { issueJWT } from './test_utils.js'

const __filename = fileURLToPath(import.meta.url)

describe('decode', () => {
  it('returns a decoded JWT with the expected claims, if the token was signed with a valid secret', async () => {
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
    assert.ok(decoded.exp !== undefined)
    assert.ok(decoded.iat !== undefined)
  })

  it('throws when trying to decode an invalid JWT', () => {
    assert.throws(() => {
      decode({ jwt: 'foo' })
    })
  })
})

describe('safeDecode', () => {
  it('does not throw when trying to decode an invalid JWT', () => {
    assert.doesNotThrow(async () => {
      await safeDecode({ jwt: 'foo' })
    })
  })

  it('returns an error when trying to decode an invalid JWT', async () => {
    const { error, value } = await safeDecode({ jwt: 'foo' })

    assert.ok(error)
    assert.ok(!value)
  })
})

describe('isExpired', () => {
  it('returns true when the `exp` claim is of 1 second ago', () => {
    const now = unixTimestampInSeconds()
    const token = { exp: now - 1 }

    assert.ok(isExpired(token))
  })

  it('returns false when the `exp` claim is of 1 second into the future', () => {
    const now = unixTimestampInSeconds()
    const token = { exp: now + 1 }

    assert.ok(!isExpired(token))
  })
})

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

describe('verify', () => {
  it('does not throw when trying to verify an invalid JWT', async () => {
    const algorithm = 'HS256'
    const expiration = '1 hour'
    const issuer = __filename

    const { value: key } = await secret({ alg: algorithm })

    assert.doesNotThrow(async () => {
      await verify({ expiration, issuer, jwt: 'foo', secret: key })
    })
  })

  it('returns an error when the JWT has no `scope` claim', async () => {
    const payload = {
      me: 'https://example.com'
    }

    const { expiration, issuer, jwt, secret } = await issueJWT(payload)

    const { error, value } = await verify({ expiration, issuer, jwt, secret })

    assert.ok(error)
    assert.ok(!value)
  })

  it('returns the decoded token, when the JWT has all the required claims', async () => {
    const payload = {
      me: 'https://example.com',
      scope: 'create update delete'
    }

    const { expiration, issuer, jwt, secret } = await issueJWT(payload)

    const { error, value } = await verify({
      expiration,
      issuer,
      jwt,
      secret
    })

    assert.ok(!error)
    assert.ok(value)

    const claims = value.payload

    assert.ok(claims.exp)
    assert.ok(claims.iat <= unixTimestampInSeconds())
    assert.strictEqual(claims.iss, issuer)
    assert.strictEqual(claims.me, payload.me)
    assert.ok(claims.jti)
    assert.strictEqual(claims.scope, payload.scope)
  })
})
