import assert from 'node:assert'
import fs from 'node:fs/promises'
import { describe, it, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import tmp from 'tmp'
import { defAtom } from '@thi.ng/atom'
import {
  defIssueAccessToken,
  defRevokeJWT
} from '../dist/lib/token-storage-interface/index.js'
import * as fs_impl from '../dist/lib/fs-storage/index.js'
import * as mem_impl from '../dist/lib/in-memory-storage/index.js'
import {
  assertTokenHasRequiredClaims,
  assertTokenHasRequiredAndCustomClaims,
  defTotalBlacklisted,
  jwks,
  jwks_url
} from './test_utils.js'

const __filename = fileURLToPath(import.meta.url)
const issuer = __filename
const expiration = '5 seconds'

const IMPLEMENTATIONS = ['fs', 'mem']

const init = async (impl) => {
  switch (impl) {
    case 'fs': {
      const { name: filepath } = tmp.fileSync({ postfix: '.json' })
      await fs.writeFile(filepath, '{}')

      const addToIssuedTokens = fs_impl.defAddToIssuedTokens({ filepath })
      const isBlacklisted = fs_impl.defIsAccessTokenBlacklisted({ filepath })
      const markTokenAsRevoked = fs_impl.defMarkTokenAsRevoked({ filepath })

      const issueAccessToken = defIssueAccessToken({
        addToIssuedTokens,
        expiration,
        issuer,
        jwks
      })

      const revokeJWT = defRevokeJWT({
        issuer,
        jwks_url,
        markTokenAsRevoked,
        max_token_age: expiration
      })

      const totalBlacklisted = defTotalBlacklisted(isBlacklisted)

      return {
        addToIssuedTokens,
        getIssuedTokens: fs_impl.defGetIssuedTokens({ filepath }),
        isBlacklisted,
        issueAccessToken,
        markTokenAsRevoked,
        revokeAllTokens: fs_impl.defRevokeAllTokens({ filepath }),
        revokeJWT,
        totalBlacklisted
      }
    }

    case 'mem': {
      const atom = defAtom({})

      const addToIssuedTokens = mem_impl.defAddToIssuedTokens({ atom })
      const isBlacklisted = mem_impl.defIsAccessTokenBlacklisted({ atom })
      const markTokenAsRevoked = mem_impl.defMarkTokenAsRevoked({ atom })

      const issueAccessToken = defIssueAccessToken({
        addToIssuedTokens,
        expiration,
        issuer,
        jwks
      })

      const revokeJWT = defRevokeJWT({
        issuer,
        jwks_url,
        markTokenAsRevoked,
        max_token_age: expiration
      })

      const totalBlacklisted = defTotalBlacklisted(isBlacklisted)

      return {
        addToIssuedTokens,
        getIssuedTokens: mem_impl.defGetIssuedTokens({ atom }),
        isBlacklisted,
        issueAccessToken,
        markTokenAsRevoked,
        revokeAllTokens: mem_impl.defRevokeAllTokens({ atom }),
        revokeJWT,
        totalBlacklisted
      }
    }

    default: {
      throw new Error(`Unknown implementation: ${impl}`)
    }
  }
}

IMPLEMENTATIONS.forEach((label) => {
  const suffix = ` [${label}]`

  describe(`Token storage${suffix}`, () => {
    let impl
    beforeEach(async () => {
      impl = await init(label)
    })

    describe(`once initialized, this implementation${suffix}`, () => {
      it('has a addToIssuedTokens method', () => {
        assert.ok(impl.addToIssuedTokens)
      })

      it('has a getIssuedTokens method', () => {
        assert.ok(impl.getIssuedTokens)
      })

      it('has a isBlacklisted method', () => {
        assert.ok(impl.isBlacklisted)
      })

      it('has a markTokenAsRevoked method', () => {
        assert.ok(impl.markTokenAsRevoked)
      })

      it('has a revokeAllTokens method', () => {
        assert.ok(impl.revokeAllTokens)
      })

      it('has a issueAccessToken method', () => {
        assert.ok(impl.issueAccessToken)
      })

      it('has a revokeJWT method', () => {
        assert.ok(impl.revokeJWT)
      })
    })

    describe(`issuing JWTs${suffix}`, () => {
      it(`initial state: no JWTs issued`, async () => {
        const { error, value } = await impl.getIssuedTokens()
        assert.ok(!error)
        assert.ok(value)

        assert.strictEqual(value.jtis.length, 0)
      })

      it(`issues a JWT that has required claims when no payload is passed`, async () => {
        const { error: issue_error, value } = await impl.issueAccessToken()
        assert.ok(!issue_error)

        await assertTokenHasRequiredClaims(value.jwt)
      })

      it(`issues a JWT that has required+custom claims when a payload is passed`, async () => {
        const payload = { foo: 'bar' }
        const { error: issue_error, value } = await impl.issueAccessToken(
          payload
        )
        assert.ok(!issue_error)

        await assertTokenHasRequiredAndCustomClaims(value.jwt, payload)
      })
    })

    describe(`revoking JWTs${suffix}`, () => {
      it('cannot revoke a JWT that has no `me` claim', async () => {
        const payload = {
          no_me: 'https://example.com/',
          scope: 'create update'
        }

        const { error: issue_error, value } = await impl.issueAccessToken(
          payload
        )
        assert.ok(!issue_error)
        const { jwt } = value
        assert.ok(jwt)
        await assertTokenHasRequiredAndCustomClaims(jwt, payload)

        const { error: revoke_error, value: revoke_value } =
          await impl.revokeJWT(jwt)

        assert.ok(revoke_error)
        assert.equal(revoke_value, undefined)
      })

      it('cannot revoke a JWT that has no `scope` claim', async () => {
        const payload = {
          me: 'https://example.com/',
          no_scope: 'create update'
        }

        const { error: issue_error, value } = await impl.issueAccessToken(
          payload
        )
        assert.ok(!issue_error)
        const { jwt } = value
        assert.ok(jwt)
        await assertTokenHasRequiredAndCustomClaims(jwt, payload)

        const { error: revoke_error, value: revoke_value } =
          await impl.revokeJWT(jwt)

        assert.ok(revoke_error)
        assert.equal(revoke_value, undefined)
      })

      it('when it issues two JWTs and revokes only the first one, both JWTs are marked as issued, but only the first JWT is blacklisted', async () => {
        const { value: initial_state } = await impl.getIssuedTokens()
        assert.strictEqual(initial_state.jtis.length, 0)

        const payload = { me: 'https://example.com/', scope: 'create update' }

        const { error: issue_err0, value: issue_val0 } =
          await impl.issueAccessToken(payload)
        assert.ok(!issue_err0)
        const { jwt: jwt0, claims: claims0 } = issue_val0
        assert.ok(jwt0)
        await assertTokenHasRequiredAndCustomClaims(jwt0, payload)

        const { error: issue_err1, value: issue_val1 } =
          await impl.issueAccessToken(payload)
        assert.ok(!issue_err1)
        const { jwt: jwt1, claims: claims1 } = issue_val1
        assert.ok(jwt1)
        await assertTokenHasRequiredAndCustomClaims(jwt1, payload)

        const { error: revoke_err0, value: revoke_val0 } = await impl.revokeJWT(
          jwt0
        )

        assert.ok(!revoke_err0)
        assert.ok(revoke_val0)

        const { value: final_state } = await impl.getIssuedTokens()
        assert.strictEqual(final_state.jtis.length, 2)

        const { error: black_err0, value: blacklisted0 } =
          await impl.isBlacklisted(claims0.jti)
        assert.ok(!black_err0)
        assert.ok(blacklisted0)

        const { error: black_err1, value: blacklisted1 } =
          await impl.isBlacklisted(claims1.jti)
        assert.ok(!black_err1)
        assert.ok(!blacklisted1)
      })

      it('can revoke all JTWs that have been issued', async () => {
        const payload = { me: 'https://example.com/', scope: 'create update' }

        const r0 = await impl.issueAccessToken(payload)
        const r1 = await impl.issueAccessToken(payload)
        const r2 = await impl.issueAccessToken(payload)

        const jwts = [r0, r1, r2].map((r) => {
          assert.ok(!r.error)
          assert.ok(r.value)
          return r.value.jwt
        })

        const { value: state_before_revoke_one } = await impl.getIssuedTokens()
        assert.strictEqual(state_before_revoke_one.jtis.length, 3)

        const b0 = await impl.totalBlacklisted(state_before_revoke_one.jtis)
        assert.strictEqual(b0, 0)

        const { error: revoke_one_error } = await impl.revokeJWT(jwts[0])
        assert.ok(!revoke_one_error)

        const { value: state_after_revoke_one } = await impl.getIssuedTokens()

        const b1 = await impl.totalBlacklisted(state_after_revoke_one.jtis)
        assert.strictEqual(b1, 1)

        const { error: revoke_all_error } = await impl.revokeAllTokens()
        assert.ok(!revoke_all_error)

        const { value: state_after_revoke_all } = await impl.getIssuedTokens()
        assert.strictEqual(state_after_revoke_all.jtis.length, 3)

        const b_end = await impl.totalBlacklisted(state_after_revoke_all.jtis)
        assert.strictEqual(b_end, 3)
      })
    })
  })
})
