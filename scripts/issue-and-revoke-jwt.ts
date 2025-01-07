import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defAtom } from '@thi.ng/atom'
import { table } from 'table'
import type {
  GetIssuedTokens,
  IsAccessTokenBlacklisted,
  RevokeAllTokens
} from '../src/lib/schemas/index.js'
import {
  RefreshTokenTable,
  StoreRefreshToken,
  type AccessTokenTable,
  type RetrieveAccessToken,
  type StoreAccessToken
} from '../src/lib/token-storage-interface/index.js'
import * as DEFAULT from '../src/defaults.js'
import { issueToken } from '../src/lib/issue-token.js'
import { defRevokeAccessToken } from '../src/lib/revoke-access-token.js'
import { privateJWKS } from './utils.js'

// implementations
import * as fs_impl from '../src/lib/fs-storage/index.js'
import * as mem_impl from '../src/lib/in-memory-storage/index.js'

// Run this script with --impl <impl> to test an implementation ////////////////
// const IMPLEMENTATION = 'fs'
// const IMPLEMENTATION = 'mem'
const IMPLEMENTATIONS = ['fs', 'mem']
const args = process.argv.slice(2)
assert.ok(args && args[0] === '--impl', `the first CLI arg must be --impl`)
const IMPLEMENTATION = args[1]
assert.ok(
  IMPLEMENTATION === 'fs' || IMPLEMENTATION === 'mem',
  `the second CLI arg must be one of: ${IMPLEMENTATIONS.join(', ')}`
)
////////////////////////////////////////////////////////////////////////////////

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')

const filepath_access_tokens = path.join(assets_dir, 'access-tokens.json')
const filepath_refresh_tokens = path.join(assets_dir, 'refresh-tokens.json')

const access_token_expiration = '5 minutes'
const refresh_token_expiration = '24 hours'
const issuer = __filename
const client_id = 'http://localhost:3001/id'

// 🚧❌🚨⛔❗
const EMOJI = {
  TOKEN_ISSUED: '🔑',
  TOKEN_REVOKED: '🚫',
  ALL_TOKENS_REVOKED: '🚧'
}

interface StatusConfig {
  implementation: string
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  jtis: string[]
}

const status = async (config: StatusConfig) => {
  const { implementation, isAccessTokenBlacklisted, jtis } = config

  const entries = [['JTI', 'blacklisted?']]

  await Promise.all(
    jtis.map(async (jti) => {
      const { error, value: blacklisted } = await isAccessTokenBlacklisted(jti)
      assert.ok(!error)
      if (blacklisted) {
        entries.push([jti, 'yes'])
      } else {
        entries.push([jti, 'no'])
      }
    })
  )

  const header_content = `Tokens issued (${implementation} implementation)`
  console.log(
    table(entries, { header: { alignment: 'center', content: header_content } })
  )
}

interface Config {
  implementation: 'fs' | 'mem'
  revoke_all?: boolean
}

const atom_access_tokens = defAtom<AccessTokenTable>({})
const atom_refresh_tokens = defAtom<RefreshTokenTable>({})

if (!fs.existsSync(filepath_access_tokens)) {
  console.log(`Creating fs token issue table at ${filepath_access_tokens}`)
  fs.writeFileSync(filepath_access_tokens, JSON.stringify({}), 'utf8')
}
if (!fs.existsSync(filepath_refresh_tokens)) {
  console.log(`Creating fs token issue table at ${filepath_refresh_tokens}`)
  fs.writeFileSync(filepath_refresh_tokens, JSON.stringify({}), 'utf8')
}

const run = async (config: Config) => {
  const { implementation, revoke_all } = config
  const report_all_ajv_errors = true

  const jwks = await privateJWKS()

  const jwks_url = new URL(DEFAULT.JWKS_PUBLIC_URL)

  let getIssuedTokens: GetIssuedTokens // TODO: implement retrieveAccessTokens
  let isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  let retrieveAccessToken: RetrieveAccessToken
  let revokeAllTokens: RevokeAllTokens
  let storeAccessToken: StoreAccessToken
  let storeRefreshToken: StoreRefreshToken
  switch (implementation) {
    case 'fs': {
      getIssuedTokens = fs_impl.defGetIssuedTokens({
        filepath: filepath_access_tokens
      })
      isAccessTokenBlacklisted = fs_impl.defIsAccessTokenBlacklisted({
        filepath: filepath_access_tokens
      })
      retrieveAccessToken = fs_impl.defRetrieveAccessToken({
        filepath: filepath_access_tokens,
        report_all_ajv_errors
      })
      revokeAllTokens = fs_impl.defRevokeAllTokens({
        filepath: filepath_access_tokens
      })
      storeAccessToken = fs_impl.defStoreAccessToken({
        filepath: filepath_access_tokens,
        report_all_ajv_errors
      })
      storeRefreshToken = fs_impl.defStoreRefreshToken({
        filepath: filepath_refresh_tokens,
        report_all_ajv_errors
      })
      break
    }
    case 'mem': {
      getIssuedTokens = mem_impl.defGetIssuedTokens({
        atom: atom_access_tokens
      })
      isAccessTokenBlacklisted = mem_impl.defIsAccessTokenBlacklisted({
        atom: atom_access_tokens
      })
      retrieveAccessToken = mem_impl.defRetrieveAccessToken({
        atom: atom_access_tokens,
        report_all_ajv_errors
      })
      revokeAllTokens = mem_impl.defRevokeAllTokens({
        atom: atom_access_tokens
      })
      storeAccessToken = mem_impl.defStoreAccessToken({
        atom: atom_access_tokens,
        report_all_ajv_errors
      })
      storeRefreshToken = mem_impl.defStoreRefreshToken({
        atom: atom_refresh_tokens,
        report_all_ajv_errors
      })
      break
    }
    default: {
      throw new Error(`${implementation} not implemented`)
    }
  }

  const revokeAccessToken = defRevokeAccessToken({
    issuer,
    jwks_url,
    max_token_age: access_token_expiration,
    retrieveAccessToken,
    storeAccessToken
  })

  const me = 'https://giacomodebidda.com/'
  const redirect_uri = 'https://example.com/'
  const scope = 'create update'

  const { error: issue_err0, value: issue_val0 } = await issueToken({
    client_id,
    access_token_expiration,
    refresh_token_expiration,
    issuer,
    jwks,
    me,
    redirect_uri,
    scope,
    storeAccessToken,
    storeRefreshToken
  })
  assert.ok(!issue_err0)
  console.log(`${EMOJI.TOKEN_ISSUED} issued token`) // decode JWT and log 'jti'

  const { error: issue_err1, value: issue_val1 } = await issueToken({
    client_id,
    access_token_expiration,
    refresh_token_expiration,
    issuer,
    jwks,
    me,
    redirect_uri,
    scope,
    storeAccessToken,
    storeRefreshToken
  })
  assert.ok(!issue_err1)
  console.log(`${EMOJI.TOKEN_ISSUED} issued token`)

  const jwt0 = issue_val0.access_token

  // revoke only the first JWT
  const { error: revoke_err0, value: revoke_val0 } = await revokeAccessToken(
    jwt0,
    {
      revocation_reason: `revoke_one (script ${__filename})`
    }
  )
  assert.ok(!revoke_err0)
  console.log(`${EMOJI.TOKEN_REVOKED} revoked token ${revoke_val0.jti}`)

  const { error, value } = await getIssuedTokens()
  assert.ok(!error)
  assert.ok(value)

  const jtis = value.jtis

  await status({ implementation, jtis, isAccessTokenBlacklisted })

  if (revoke_all) {
    const { error, value } = await revokeAllTokens({
      revocation_reason: `revoke_all (script ${__filename})`
    })
    assert.ok(!error)
    assert.ok(value)
    console.log(`${EMOJI.ALL_TOKENS_REVOKED} Revoked ALL access tokens`)

    await status({ implementation, jtis, isAccessTokenBlacklisted })

    // Since we cannot inspect the state of the in-memory after this script
    // exits, we print it here.
    if (revoke_all && IMPLEMENTATION === 'mem') {
      console.log(`=== in-memory implementation state ===`)
      console.log(atom_access_tokens.deref())
    }
  }
}

run({ implementation: IMPLEMENTATION })

let timeout_id: NodeJS.Timeout
timeout_id = setTimeout(() => {
  run({ implementation: IMPLEMENTATION })
}, 1000)

timeout_id = setTimeout(() => {
  run({ implementation: IMPLEMENTATION, revoke_all: true })

  clearTimeout(timeout_id)
}, 2000)
