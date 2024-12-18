import assert from 'node:assert'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'
import { codeVerifier, codeChallenge } from '../../dist/lib/pkce/index.js'

describe('codeChallenge', () => {
  it('returns the code_verifier when method is `plain`', () => {
    const code_verifier = codeVerifier({ len: 43 })
    const code_challenge = codeChallenge({ method: 'plain', code_verifier })

    assert.strictEqual(code_challenge, code_verifier)
  })

  it('returns a hashed, base64-encoded string when method is `S256`', () => {
    const code_verifier = codeVerifier({ len: 43 })
    const code_challenge = codeChallenge({ method: 'S256', code_verifier })

    const expected = createHash('sha256')
      .update(code_verifier)
      .digest('base64url')

    assert.strictEqual(code_challenge, expected)
  })
})
