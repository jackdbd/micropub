import assert from 'node:assert'
import { describe, it } from 'node:test'
import { codeVerifier } from '../../dist/lib/pkce/index.js'

describe('codeVerifier', () => {
  it('returns a different value when using the same `len` but no `seed`', () => {
    const a = codeVerifier({ len: 43 })
    const b = codeVerifier({ len: 43 })
    const c = codeVerifier({ len: 43 })

    assert.notEqual(a, b)
    assert.notEqual(b, c)
  })

  it('returns the same value when using the same `len` and the same `seed`', () => {
    const seed = 123
    const a = codeVerifier({ len: 43, seed })
    const b = codeVerifier({ len: 43, seed })
    const c = codeVerifier({ len: 43, seed })

    assert.strictEqual(a, b)
    assert.strictEqual(b, c)
  })
})
