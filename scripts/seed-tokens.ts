import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import {
  createClient,
  type Client,
  type Config as ClientConfig
} from '@libsql/client'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import ms, { StringValue } from 'ms'
import { nanoid } from 'nanoid'
import { unixTimestampInMs } from '../src/lib/date.js'
import { issueToken } from '../src/lib/issue-token.js'
import type {
  RetrieveAuthorizationCode,
  StoreAuthorizationCode
} from '../src/lib/authorization-code-storage-interface/index.js'
import type {
  RetrieveAccessToken,
  RetrieveRefreshToken,
  StoreAccessToken,
  StoreRefreshToken
} from '../src/lib/token-storage-interface/index.js'
import { AccessTokenClaims, safeDecode } from '../src/lib/token/index.js'
import * as sqlite_impl from '../src/lib/turso-storage/index.js'
import { privateJWKS, EMOJI, unwrap, unwrapPromise } from './utils.js'

const __filename = fileURLToPath(import.meta.url)

type Databases = { [key: string]: ClientConfig }

const databases: Databases = {
  dev: { url: 'file:micropub-dev.db' },
  prod: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_DATABASE_TOKEN!
  }
}

type DB = keyof typeof databases

const DATABASE_IDS = Object.keys(databases)

const args = process.argv.slice(2)
assert.ok(args && args[0] === '--db', `the first CLI arg must be --db`)
assert.ok(
  DATABASE_IDS.includes(args[1]),
  `the second CLI arg must be one of: ${DATABASE_IDS.join(', ')}`
)

interface Config {
  db: DB
}

const run = async (config: Config) => {
  const { db } = config
  const report_all_ajv_errors = true
  const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])

  let client: Client
  let retrieveAuthorizationCode: RetrieveAuthorizationCode
  let retrieveAccessToken: RetrieveAccessToken
  let retrieveRefreshToken: RetrieveRefreshToken
  let storeAuthorizationCode: StoreAuthorizationCode
  let storeAccessToken: StoreAccessToken
  let storeRefreshToken: StoreRefreshToken
  switch (db) {
    case 'dev': {
      client = createClient(databases.dev)
      retrieveAuthorizationCode = sqlite_impl.defRetrieveAuthorizationCode({
        ajv,
        client
      })
      retrieveAccessToken = sqlite_impl.defRetrieveAccessToken({ ajv, client })
      storeAuthorizationCode = sqlite_impl.defStoreAuthorizationCode({
        ajv,
        client
      })
      retrieveRefreshToken = sqlite_impl.defRetrieveRefreshToken({
        ajv,
        client
      })
      storeAccessToken = sqlite_impl.defStoreAccessToken({ ajv, client })
      storeRefreshToken = sqlite_impl.defStoreRefreshToken({ ajv, client })
      break
    }
    case 'prod': {
      client = createClient(databases.prod)
      retrieveAccessToken = sqlite_impl.defRetrieveAccessToken({ ajv, client })
      retrieveAuthorizationCode = sqlite_impl.defRetrieveAuthorizationCode({
        ajv,
        client
      })
      retrieveRefreshToken = sqlite_impl.defRetrieveRefreshToken({
        ajv,
        client
      })
      storeAuthorizationCode = sqlite_impl.defStoreAuthorizationCode({
        ajv,
        client
      })
      storeAccessToken = sqlite_impl.defStoreAccessToken({ ajv, client })
      storeRefreshToken = sqlite_impl.defStoreRefreshToken({ ajv, client })
      break
    }
    default: {
      throw new Error(`database ${db} not implemented`)
    }
  }

  const access_token_expiration = '5 minutes'
  const refresh_token_expiration = '24 hours'
  const issuer = __filename
  const client_id = 'http://localhost:3001/id'
  const me = 'https://giacomodebidda.com/'
  const redirect_uri = 'http://localhost:3001/auth/callback'
  const scope = 'create update profile email'

  const exp = Math.floor(
    (unixTimestampInMs() + ms(refresh_token_expiration as StringValue)) / 1000
  )

  const { error: code_error, value: code_value } = await storeAuthorizationCode(
    {
      client_id,
      code: nanoid(),
      code_challenge: '1234567890123456789012345678901234567890123',
      code_challenge_method: 'S256',
      exp,
      iss: issuer,
      me,
      redirect_uri,
      scope
    }
  )

  assert.ok(!code_error, `${EMOJI.ERROR} ${code_error?.message}`)
  console.log(`${EMOJI.AUTHORIZATION_CODE_ISSUED} issued authorization code`)
  console.log(code_value)

  const result_code = await retrieveAuthorizationCode(code_value.code)
  assert.ok(!result_code.error, `${EMOJI.ERROR} ${result_code.error?.message}`)

  const jwks = await privateJWKS()

  const { error: token_error, value: token_value } = await issueToken({
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

  assert.ok(!token_error, `${EMOJI.ERROR} ${token_error?.message}`)
  console.log(`${EMOJI.TOKEN_ISSUED} issued token`)
  console.log(token_value)

  const claims = await unwrapPromise(
    safeDecode<AccessTokenClaims>(token_value.access_token)
  )

  const { jti } = claims

  const access_token_record = await unwrapPromise(retrieveAccessToken(jti))

  console.log(`${EMOJI.TOKEN_ISSUED} access token record`)
  console.log(access_token_record)

  const result_refresh = await retrieveRefreshToken(token_value.refresh_token)
  assert.ok(
    !result_refresh.error,
    `${EMOJI.ERROR} ${result_refresh.error?.message}`
  )
  console.log(`${EMOJI.TOKEN_ISSUED} retrieved refresh token`)
  console.log(result_refresh.value)

  const rs_a = await client.execute(
    'SELECT COUNT(*) as total FROM access_tokens'
  )
  console.log(`${rs_a.rows[0]['total']} access tokens in DB`)
  const rs_access = await client.execute('SELECT * FROM access_tokens')
  for (const row of rs_access.rows) {
    console.log(row)
  }

  const rs_r = await client.execute(
    'SELECT COUNT(*) as total FROM refresh_tokens'
  )
  console.log(`${rs_r.rows[0]['total']} refresh tokens in DB`)
  const rs_refresh = await client.execute('SELECT * FROM refresh_tokens')
  for (const row of rs_refresh.rows) {
    console.log(row)
  }
}

run({ db: args[1] as DB })
