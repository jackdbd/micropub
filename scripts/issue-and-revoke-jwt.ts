import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defAtom } from '@thi.ng/atom'
import { table } from 'table'
import type {
  AddToIssuedTokens,
  GetIssuedTokens,
  IsAccessTokenBlacklisted,
  MarkTokenAsRevoked,
  RevokeAllTokens
} from '../src/lib/schemas/index.js'
import {
  type AccessTokenTable,
  defIssueAccessToken,
  defRevokeJWT
} from '../src/lib/token-storage-interface/index.js'
import * as DEFAULT from '../src/defaults.js'

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

const filepath = path.join(assets_dir, 'issued-access-tokens.json')

const expiration = '5 minutes'
const issuer = __filename

// 🚧❌🚨⛔❗
const EMOJI = {
  TOKEN_ISSUED: '🔑',
  TOKEN_REVOKED: '🚫',
  ALL_TOKENS_REVOKED: '🚧'
}

if (!DEFAULT.JWKS) {
  throw new Error('JWKS not set')
}
export const jwks = JSON.parse(DEFAULT.JWKS)

export const jwks_url = new URL(DEFAULT.JWKS_PUBLIC_URL)

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

const atom = defAtom<AccessTokenTable>({})

if (!fs.existsSync(filepath)) {
  console.log(`Creating fs token issue table at ${filepath}`)
  fs.writeFileSync(filepath, JSON.stringify({}), 'utf8')
}

const run = async (config: Config) => {
  const { implementation, revoke_all } = config

  let addToIssuedTokens: AddToIssuedTokens
  let getIssuedTokens: GetIssuedTokens
  let isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  let markTokenAsRevoked: MarkTokenAsRevoked
  let revokeAllTokens: RevokeAllTokens
  switch (implementation) {
    case 'fs': {
      addToIssuedTokens = fs_impl.defAddToIssuedTokens({ filepath })
      getIssuedTokens = fs_impl.defGetIssuedTokens({ filepath })
      isAccessTokenBlacklisted = fs_impl.defIsAccessTokenBlacklisted({
        filepath
      })
      markTokenAsRevoked = fs_impl.defMarkTokenAsRevoked({ filepath })
      revokeAllTokens = fs_impl.defRevokeAllTokens({ filepath })
      break
    }
    case 'mem': {
      addToIssuedTokens = mem_impl.defAddToIssuedTokens({ atom })
      getIssuedTokens = mem_impl.defGetIssuedTokens({ atom })
      isAccessTokenBlacklisted = mem_impl.defIsAccessTokenBlacklisted({ atom })
      markTokenAsRevoked = mem_impl.defMarkTokenAsRevoked({ atom })
      revokeAllTokens = mem_impl.defRevokeAllTokens({ atom })
      break
    }
    default: {
      throw new Error(`${implementation} not implemented`)
    }
  }

  const issueJWT = defIssueAccessToken({
    addToIssuedTokens,
    expiration,
    issuer,
    jwks
  })

  const revokeJWT = defRevokeJWT({
    markTokenAsRevoked,
    issuer,
    jwks_url,
    max_token_age: expiration
  })

  const payload = {
    me: 'https://giacomodebidda.com/', // required
    scope: 'create update' // required
  }

  const { error: issue_err0, value: issue_val0 } = await issueJWT(payload)
  assert.ok(!issue_err0)
  console.log(`${EMOJI.TOKEN_ISSUED} Issued token ${issue_val0.claims.jti}`)

  const { error: issue_err1, value: issue_val1 } = await issueJWT({
    ...payload,
    foo: 'bar' // any additional claim you want...
  })
  assert.ok(!issue_err1)
  console.log(`${EMOJI.TOKEN_ISSUED} Issued token ${issue_val1.claims.jti}`)

  const jwt0 = issue_val0.jwt

  // revoke only the first JWT
  const { error: revoke_err0, value: revoke_val0 } = await revokeJWT(jwt0, {
    revocation_reason: 'revoke_one (e.g. user_logout)' // optional
  })
  assert.ok(!revoke_err0)
  console.log(`${EMOJI.TOKEN_REVOKED} Revoked token ${revoke_val0.jti}`)

  const { error, value } = await getIssuedTokens()
  assert.ok(!error)
  assert.ok(value)

  const jtis = value.jtis

  await status({ implementation, jtis, isAccessTokenBlacklisted })

  if (revoke_all) {
    const { error, value } = await revokeAllTokens({
      revocation_reason: 'revoke_all (e.g. security_breach)' // optional
    })
    assert.ok(!error)
    assert.ok(value)
    console.log(`${EMOJI.ALL_TOKENS_REVOKED} Revoked ALL tokens`)

    await status({ implementation, jtis, isAccessTokenBlacklisted })

    // Since we cannot inspect the state of the in-memory after this script
    // exits, we print it here.
    if (revoke_all && IMPLEMENTATION === 'mem') {
      console.log(`=== in-memory implementation state ===`)
      console.log(atom.deref())
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
