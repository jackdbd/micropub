import assert from 'node:assert'
import { describe, it } from 'node:test'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../dist/lib/date.js'
import { randomKid, safeDecode, sign, verify } from '../dist/lib/token/index.js'
import { issueJWT } from './test_utils.js'
import {
  ACCESS_TOKEN_EXPIRATION,
  ISSUER,
  jwks,
  jwks_url
} from './test_utils.js'

describe('safeDecode', () => {
  it('does not throw when trying to decode an invalid JWT', () => {
    assert.doesNotThrow(async () => {
      await safeDecode('foo')
    })
  })

  it('returns an error when trying to decode an invalid JWT', async () => {
    const { error, value } = await safeDecode('foo')

    assert.ok(error)
    assert.ok(!value)
  })

  it('returns the expected claims, if the JWT was signed with a valid secret', async () => {
    const expiration = ACCESS_TOKEN_EXPIRATION
    const issuer = ISSUER
    const payload = { abc: nanoid(), xyz: nanoid() }

    const { error: kid_error, value: kid } = randomKid(jwks.keys)
    assert.ok(!kid_error)
    assert.ok(kid)

    const { error: sign_error, value: jwt } = await sign({
      expiration,
      issuer,
      jwks,
      kid,
      payload
    })

    assert.ok(!sign_error)
    assert.ok(jwt)

    const { error: decode_error, value: claims } = await safeDecode(jwt)
    assert.ok(!decode_error)
    assert.ok(claims)

    assert.strictEqual(claims.iss, issuer)
    assert.ok(claims.exp !== undefined)
    assert.ok(claims.iat !== undefined)
    assert.ok(claims.jti !== undefined)

    Object.entries(payload).forEach(([key, value]) => {
      assert.strictEqual(claims[key], value)
    })
  })
})

describe('sign', () => {
  it('can issue a JWT', async () => {
    const { error: kid_error, value: kid } = randomKid(jwks.keys)
    assert.ok(!kid_error)

    const { error, value: jwt } = await sign({
      expiration: '1 hour',
      issuer: ISSUER,
      jwks,
      kid,
      payload: { foo: 'bar' }
    })

    assert.ok(!error)
    assert.ok(jwt)
  })
})

describe('verify', () => {
  it('does not throw when trying to verify an invalid JWT', async () => {
    const expiration = ACCESS_TOKEN_EXPIRATION
    const issuer = ISSUER

    assert.doesNotThrow(async () => {
      await verify({
        issuer,
        jwks_url,
        jwt: 'foo',
        max_token_age: expiration
      })
    })
  })

  it('returns an error when the JWT has no `scope` claim', async () => {
    const payload = {
      me: 'https://example.com'
    }

    const { expiration, issuer, jwt } = await issueJWT(payload)

    const { error, value } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    assert.ok(error)
    assert.ok(!value)
  })

  it('returns the decoded token, when the JWT has all the required claims', async () => {
    const payload = {
      me: 'https://example.com',
      scope: 'create update delete'
    }

    const { expiration, issuer, jwt } = await issueJWT(payload)

    const { error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    assert.ok(!error)
    assert.ok(claims)

    assert.ok(claims.exp)
    assert.ok(claims.iat <= unixTimestampInSeconds())
    assert.strictEqual(claims.iss, issuer)
    assert.strictEqual(claims.me, payload.me)
    assert.ok(claims.jti)
    assert.strictEqual(claims.scope, payload.scope)
  })
})
