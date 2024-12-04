import assert from 'node:assert'
import { describe, it, after } from 'node:test'
import { defStore as defAtomStore } from '../dist/lib/atom-store/index.js'
import { defStore as defFileSystemStore } from '../dist/lib/fs-store/index.js'

const implementations = [
  { backend: 'atom', defStore: defAtomStore },
  { backend: 'fs', defStore: defFileSystemStore }
]

implementations.forEach(({ backend, defStore }) => {
  const suffix = `[${backend} backend]`

  // const store = defStore()

  describe(`Token store ${suffix}`, () => {
    after(async () => {
      const store = defStore()
      if (store.cleanup) {
        await store.cleanup()
      }
    })

    describe(`blacklist ${suffix}`, () => {
      it(`is empty at the beginning ${suffix}`, async () => {
        const store = defStore()

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const blacklist = await store.blacklist()
        assert.strictEqual(blacklist.size, 0)
      })

      it.skip(`has size 2 if the token store is initialized with 2 blacklisted jti ${suffix}`, async () => {
        const store = defStore({
          blacklist: ['blacklisted-jti-0', 'blacklisted-jti-1']
        })

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const blacklist = await store.blacklist()
        assert.strictEqual(blacklist.size, 2)
      })

      it(`contains the jti claim of the token that was just revoked ${suffix}`, async () => {
        const store = defStore()

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const payload = {
          me: 'https://example.com',
          scope: 'create update delete'
        }

        const { error: issue_error, value: issue_value } = await store.issue({
          payload
        })

        assert.ok(!issue_error)
        assert.ok(issue_value)

        const { jwt, claims } = issue_value
        const expected_jti = claims.jti

        const { error: revoke_error, value: revoke_value } = await store.revoke(
          {
            jwt
          }
        )

        assert.ok(!revoke_error)
        assert.ok(revoke_value)

        const blacklist = await store.blacklist()

        assert.strictEqual(revoke_value.jti, expected_jti)
        assert.strictEqual(blacklist.size, 1)
      })
    })

    describe(`issuelist ${suffix}`, () => {
      it(`is empty at the beginning ${suffix}`, async () => {
        const store = defStore()

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const issuelist = await store.issuelist()

        assert.strictEqual(issuelist.size, 0)
      })

      it.skip(`has size 2 if the token store is initialized with 2 issued jti ${suffix}`, async () => {
        const store = defStore({
          issuelist: ['issued-jti-0', 'issued-jti-1']
        })

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const issuelist = await store.issuelist()
        assert.strictEqual(issuelist.size, 2)
      })

      it(`contains the jti claim of each token that was issued ${suffix}`, async () => {
        const store = defStore()

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const result_0 = await store.issue({
          payload: {
            me: 'https://example.com',
            scope: 'create update'
          }
        })

        assert.ok(!result_0.error)
        assert.ok(result_0.value)

        const result_1 = await store.issue({
          payload: {
            me: 'https://example.com',
            scope: 'create update delete undelete media'
          }
        })

        assert.ok(!result_1.error)
        assert.ok(result_1.value)

        const issuelist = await store.issuelist()

        assert.strictEqual(issuelist.size, 2)
      })
    })

    describe(`revokeAll ${suffix}`, () => {
      it(`revokes all tokens that have been issued ${suffix}`, async () => {
        const store = defStore()

        const { error: init_error } = await store.init()
        assert.ok(!init_error)

        const payload = {
          me: 'https://example.com',
          scope: 'create update delete undelete media'
        }

        await store.issue({ payload })
        await store.issue({ payload })
        await store.issue({ payload })

        const blacklist_before = await store.blacklist()
        const issuelist_before = await store.issuelist()
        assert.strictEqual(blacklist_before.size, 0)
        assert.strictEqual(issuelist_before.size, 3)

        const { error } = await store.revokeAll()
        assert.ok(!error)

        const blacklist_after = await store.blacklist()
        const issuelist_after = await store.issuelist()

        assert.strictEqual(blacklist_after.size, 3)
        assert.strictEqual(issuelist_after.size, 3)
      })
    })
  })
})
