import assert from 'node:assert'
import fs from 'node:fs/promises'
import { describe, it, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import tmp from 'tmp'
import { defAtom } from '@thi.ng/atom'
import { defIssueAccessToken } from '../dist/lib/issue-access-token.js'
import { defRevokeAccessToken } from '../dist/lib/revoke-access-token.js'
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

const report_all_ajv_errors = true

const init = async (impl) => {
  switch (impl) {
    case 'fs': {
      const { name: filepath } = tmp.fileSync({ postfix: '.json' })
      await fs.writeFile(filepath, '{}')

      const isBlacklisted = fs_impl.defIsAccessTokenBlacklisted({
        filepath,
        report_all_ajv_errors
      })

      const retrieveAccessToken = fs_impl.defRetrieveAccessToken({
        filepath,
        report_all_ajv_errors
      })

      const storeAccessToken = fs_impl.defStoreAccessToken({
        filepath,
        report_all_ajv_errors
      })

      const issueAccessToken = defIssueAccessToken({
        expiration,
        issuer,
        jwks,
        storeAccessToken
      })

      const revokeAccessToken = defRevokeAccessToken({
        issuer,
        jwks_url,
        max_token_age: expiration,
        retrieveAccessToken,
        storeAccessToken
      })

      const totalBlacklisted = defTotalBlacklisted(isBlacklisted)

      return {
        getIssuedTokens: fs_impl.defGetIssuedTokens({ filepath }),
        isBlacklisted,
        issueAccessToken,
        retrieveAccessToken,
        revokeAccessToken,
        storeAccessToken,
        totalBlacklisted
      }
    }

    case 'mem': {
      const atom = defAtom({})

      const isBlacklisted = mem_impl.defIsAccessTokenBlacklisted({ atom })

      const retrieveAccessToken = mem_impl.defRetrieveAccessToken({
        atom,
        report_all_ajv_errors
      })

      const storeAccessToken = mem_impl.defStoreAccessToken({
        atom,
        report_all_ajv_errors
      })

      const issueAccessToken = defIssueAccessToken({
        expiration,
        issuer,
        jwks,
        storeAccessToken
      })

      const revokeAccessToken = defRevokeAccessToken({
        issuer,
        jwks_url,
        max_token_age: expiration,
        retrieveAccessToken,
        storeAccessToken
      })

      const totalBlacklisted = defTotalBlacklisted(isBlacklisted)

      return {
        getIssuedTokens: mem_impl.defGetIssuedTokens({ atom }),
        isBlacklisted,
        issueAccessToken,
        retrieveAccessToken,
        revokeAccessToken,
        storeAccessToken,
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
      it('has a getIssuedTokens method', () => {
        assert.ok(impl.getIssuedTokens)
      })

      it('has a isBlacklisted method', () => {
        assert.ok(impl.isBlacklisted)
      })

      it('has a storeAccessToken method', () => {
        assert.ok(impl.storeAccessToken)
      })

      it('has a issueAccessToken method', () => {
        assert.ok(impl.issueAccessToken)
      })

      it('has a revokeAccessToken method', () => {
        assert.ok(impl.revokeAccessToken)
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

        await assertTokenHasRequiredClaims(value.access_token)
      })

      it(`issues a JWT that has required+custom claims when a payload is passed`, async () => {
        const payload = { foo: 'bar' }
        const { error: issue_error, value } = await impl.issueAccessToken(
          payload
        )
        assert.ok(!issue_error)

        await assertTokenHasRequiredAndCustomClaims(value.access_token, payload)
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
        const { access_token } = value
        assert.ok(access_token)
        await assertTokenHasRequiredAndCustomClaims(access_token, payload)

        const { error: revoke_error, value: revoke_value } =
          await impl.revokeAccessToken(access_token)

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
        const { access_token } = value
        assert.ok(access_token)
        await assertTokenHasRequiredAndCustomClaims(access_token, payload)

        const { error: revoke_error, value: revoke_value } =
          await impl.revokeAccessToken(access_token)

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
        const { access_token: access_token0, claims: claims0 } = issue_val0
        assert.ok(access_token0)
        await assertTokenHasRequiredAndCustomClaims(access_token0, payload)

        const { error: issue_err1, value: issue_val1 } =
          await impl.issueAccessToken(payload)
        assert.ok(!issue_err1)
        const { access_token: access_token1, claims: claims1 } = issue_val1
        assert.ok(access_token1)
        await assertTokenHasRequiredAndCustomClaims(access_token1, payload)

        const { error: revoke_err0, value: revoke_val0 } =
          await impl.revokeAccessToken(access_token0)

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

        const access_tokens = [r0, r1, r2].map((r) => {
          assert.ok(!r.error)
          assert.ok(r.value)
          return r.value.access_token
        })

        const { value: state_before_revoke_one } = await impl.getIssuedTokens()
        assert.strictEqual(state_before_revoke_one.jtis.length, 3)

        const b0 = await impl.totalBlacklisted(state_before_revoke_one.jtis)
        assert.strictEqual(b0, 0)

        const { error: revoke_one_error } = await impl.revokeAccessToken(
          access_tokens[0]
        )
        assert.ok(!revoke_one_error)

        const { value: state_after_revoke_one } = await impl.getIssuedTokens()

        const b1 = await impl.totalBlacklisted(state_after_revoke_one.jtis)
        assert.strictEqual(b1, 1)

        // const { error: revoke_all_error } = await impl.revokeAllTokens()
        // assert.ok(!revoke_all_error)

        // const { value: state_after_revoke_all } = await impl.getIssuedTokens()
        // assert.strictEqual(state_after_revoke_all.jtis.length, 3)

        // const b_end = await impl.totalBlacklisted(state_after_revoke_all.jtis)
        // assert.strictEqual(b_end, 3)
      })
    })
  })
})
