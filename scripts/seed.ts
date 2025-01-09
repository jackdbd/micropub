import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type Client } from '@libsql/client'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import ms, { StringValue } from 'ms'
import { nanoid } from 'nanoid'
import yargs from 'yargs/yargs'
import { unixTimestampInMs } from '../src/lib/date.js'
import { issueToken } from '../src/lib/issue-token.js'
import type {
  RetrieveAuthorizationCode,
  StoreAuthorizationCode
} from '../src/lib/authorization-code-storage-interface/index.js'
import type { RegisterClient } from '../src/lib/clients-storage-interface/index.js'
import type {
  RetrieveProfile,
  StoreProfile
} from '../src/lib/profile-storage-interface/index.js'
import type {
  RetrieveAccessToken,
  RetrieveRefreshToken,
  StoreAccessToken,
  StoreRefreshToken
} from '../src/lib/token-storage-interface/index.js'
import { type AccessTokenClaims, safeDecode } from '../src/lib/token/index.js'
import * as fs_impl from '../src/lib/fs-storage/index.js'
import * as sqlite_impl from '../src/lib/turso-storage/index.js'
import { canonicalUrl } from '../src/lib/url-canonicalization.js'
import { DATABASES, DEFAULT, EMOJI, LINK_BUGS } from './constants.js'
import {
  exitOne,
  exitZero,
  logRetrieved,
  logStorageState,
  logStored,
  privateJWKS,
  unwrapP
} from './utils.js'

const USAGE = `
Seed the storage layer with some authorization codes, access/refresh tokens, client applications, user profiles.`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')
const filepath_access_tokens = path.join(assets_dir, 'access-tokens.json')
const filepath_authorization_codes = path.join(
  assets_dir,
  'authorization-codes.json'
)
const filepath_clients = path.join(assets_dir, 'clients.json')
const filepath_profiles = path.join(assets_dir, 'profiles.json')
const filepath_refresh_tokens = path.join(assets_dir, 'refresh-tokens.json')

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  .option('access-token-expiration', {
    describe: 'Access token expiration (human readable)',
    default: DEFAULT.ACCESS_TOKEN_EXPIRATION,
    type: 'string'
  })
  .option('authorization-code-expiration', {
    describe: 'Authorization code expiration (human readable)',
    default: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
    type: 'string'
  })
  .option('client-id', {
    describe: 'Client ID',
    default: DEFAULT.CLIENT_ID,
    type: 'string'
  })
  .option('issuer', {
    describe: 'Issuer for authorization codes and tokens',
    default: __filename,
    type: 'string'
  })
  .option('me', {
    describe: 'Profile URL (it will canonicalized)',
    default: DEFAULT.ME_BEFORE_CANONICALIZATION,
    type: 'string'
  })
  .option('profile-email', {
    describe: 'Profile email',
    default: DEFAULT.PROFILE_EMAIL,
    type: 'string'
  })
  .option('profile-name', {
    describe: 'Profile name',
    default: DEFAULT.PROFILE_NAME,
    type: 'string'
  })
  .option('profile-photo', {
    describe: 'Profile photo',
    default: DEFAULT.PROFILE_PHOTO,
    type: 'string'
  })
  .option('profile-url', {
    describe: 'Profile URL',
    default: DEFAULT.PROFILE_URL,
    type: 'string'
  })
  .option('redirect-uri', {
    describe: 'Redirect URI',
    default: DEFAULT.REDIRECT_URI,
    type: 'string'
  })
  .option('refresh-token-expiration', {
    describe: 'Refresh token expiration (human readable)',
    default: DEFAULT.REFRESH_TOKEN_EXPIRATION,
    type: 'string'
  })
  .option('scope', {
    describe: 'OAuth/IndieAuth/Micropub scope',
    default: DEFAULT.SCOPE,
    type: 'string'
  })
  .option('storage', {
    alias: 's',
    demandOption: true,
    describe: 'Storage backend',
    choices: ['fs', 'mem', 'sqlite-dev', 'sqlite-prod'],
    type: 'string'
  })
  .option('report-all-ajv-errors', {
    boolean: true,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS,
    describe:
      'If true, report all AJV validation errors (instead of only the first one)'
  })
  .option('verbose', {
    boolean: true,
    default: DEFAULT.VERBOSE,
    describe: 'If true, produce verbose output (i.e. log more stuff'
  })
  .example('$0 --storage fs', 'Seed the filesystem')
  .example(
    '$0 -s sqlite-dev --verbose',
    "Seed the 'sqlite-dev' database, produce a verbose output"
  )
  .help('help')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

const run = async () => {
  const ajv = addFormats(new Ajv({ allErrors: argv.reportAllAjvErrors }), [
    'email',
    'uri'
  ])

  const { issuer, storage, verbose } = argv

  let client: Client | undefined
  let retrieveAccessToken: RetrieveAccessToken
  let retrieveAuthorizationCode: RetrieveAuthorizationCode
  let retrieveProfile: RetrieveProfile
  let retrieveRefreshToken: RetrieveRefreshToken
  let storeAccessToken: StoreAccessToken
  let storeAuthorizationCode: StoreAuthorizationCode
  let storeClient: RegisterClient
  let storeProfile: StoreProfile
  let storeRefreshToken: StoreRefreshToken
  switch (storage) {
    case 'fs': {
      const {
        defStoreAccessToken,
        defStoreAuthorizationCode,
        defStoreProfile,
        defStoreRefreshToken,
        defRegisterClient,
        defRetrieveAccessToken,
        defRetrieveAuthorizationCode,
        defRetrieveProfile,
        defRetrieveRefreshToken
      } = fs_impl

      storeAccessToken = defStoreAccessToken({
        filepath: filepath_access_tokens
      })
      storeAuthorizationCode = defStoreAuthorizationCode({
        filepath: filepath_authorization_codes
      })
      storeClient = defRegisterClient({
        filepath: filepath_clients
      })
      storeProfile = defStoreProfile({
        filepath: filepath_profiles
      })
      storeRefreshToken = defStoreRefreshToken({
        filepath: filepath_refresh_tokens
      })
      retrieveAccessToken = defRetrieveAccessToken({
        filepath: filepath_access_tokens
      })
      retrieveAuthorizationCode = defRetrieveAuthorizationCode({
        filepath: filepath_authorization_codes
      })
      retrieveProfile = defRetrieveProfile({
        filepath: filepath_profiles
      })
      retrieveRefreshToken = defRetrieveRefreshToken({
        filepath: filepath_refresh_tokens
      })
      break
    }
    case 'sqlite-dev': {
      client = createClient(DATABASES.DEV)

      const {
        defRetrieveAccessToken,
        defRetrieveAuthorizationCode,
        defRetrieveProfile,
        defRetrieveRefreshToken,
        defStoreAccessToken,
        defStoreAuthorizationCode,
        // defStoreClient,
        defStoreProfile,
        defStoreRefreshToken
      } = sqlite_impl

      retrieveAccessToken = defRetrieveAccessToken({ ajv, client })
      retrieveAuthorizationCode = defRetrieveAuthorizationCode({ ajv, client })
      retrieveProfile = defRetrieveProfile({ ajv, client })
      retrieveRefreshToken = defRetrieveRefreshToken({ ajv, client })
      storeAccessToken = defStoreAccessToken({ ajv, client })
      storeAuthorizationCode = defStoreAuthorizationCode({ ajv, client })
      storeProfile = defStoreProfile({ ajv, client })
      storeRefreshToken = defStoreRefreshToken({ ajv, client })
      break
    }
    case 'sqlite-prod': {
      client = createClient(DATABASES.PROD)

      const {
        defRetrieveAccessToken,
        defRetrieveAuthorizationCode,
        defRetrieveProfile,
        defRetrieveRefreshToken,
        defStoreAccessToken,
        defStoreAuthorizationCode,
        defStoreProfile,
        defStoreRefreshToken
      } = sqlite_impl

      retrieveAccessToken = defRetrieveAccessToken({ ajv, client })
      retrieveAuthorizationCode = defRetrieveAuthorizationCode({ ajv, client })
      retrieveProfile = defRetrieveProfile({ ajv, client })
      retrieveRefreshToken = defRetrieveRefreshToken({ ajv, client })
      storeAccessToken = defStoreAccessToken({ ajv, client })
      storeAuthorizationCode = defStoreAuthorizationCode({ ajv, client })
      storeProfile = defStoreProfile({ ajv, client })
      storeRefreshToken = defStoreRefreshToken({ ajv, client })
      break
    }
    default: {
      exitOne(`seeding storage '${storage}' not implemented`)
      return
    }
  }

  console.log(`=== storage before seeding ===`)
  await logStorageState({
    client,
    filepath_access_tokens,
    filepath_authorization_codes,
    filepath_clients,
    filepath_profiles,
    filepath_refresh_tokens,
    storage
  })

  const client_id = canonicalUrl(argv['client-id'])
  const me = canonicalUrl(argv.me)
  const scope = argv.scope
  const redirect_uri = canonicalUrl(argv['redirect-uri'])

  const profile_stored = await unwrapP(
    storeProfile({
      email: argv['profile-email'],
      me,
      name: argv['profile-name'],
      photo: argv['profile-photo'],
      url: argv['profile-url']
    })
  )

  if (verbose) {
    logStored({
      emoji: EMOJI.PROFILE,
      name: 'user profile',
      value: profile_stored
    })
  }

  const profile_retrieved = await unwrapP(retrieveProfile(me))

  if (verbose) {
    logRetrieved({
      emoji: EMOJI.PROFILE,
      name: 'user profile',
      value: profile_retrieved
    })
  }

  const exp_auth_code = Math.floor(
    (unixTimestampInMs() +
      ms(argv['authorization-code-expiration'] as StringValue)) /
      1000
  )

  const code_stored = await unwrapP(
    storeAuthorizationCode({
      client_id,
      code: nanoid(),
      code_challenge: '1234567890123456789012345678901234567890123',
      code_challenge_method: 'S256',
      exp: exp_auth_code,
      iss: issuer,
      me,
      redirect_uri,
      scope
    })
  )

  if (verbose) {
    logStored({
      emoji: EMOJI.AUTHORIZATION_CODE,
      name: 'authorization code',
      value: code_stored
    })
  }

  const { code } = code_stored

  const code_retrieved = await unwrapP(retrieveAuthorizationCode(code))

  if (verbose) {
    logRetrieved({
      emoji: EMOJI.AUTHORIZATION_CODE,
      name: 'authorization code',
      value: code_retrieved
    })
  }

  const jwks = await privateJWKS()

  const tokens_issued = await unwrapP(
    issueToken({
      client_id,
      access_token_expiration: argv['access-token-expiration'],
      refresh_token_expiration: argv['refresh-token-expiration'],
      issuer,
      jwks,
      me,
      redirect_uri,
      scope,
      storeAccessToken,
      storeRefreshToken
    })
  )

  if (verbose) {
    logStored({
      emoji: EMOJI.ACCESS_TOKEN,
      name: 'access token',
      value: tokens_issued.access_token
    })

    logStored({
      emoji: EMOJI.REFRESH_TOKEN,
      name: 'refresh token',
      value: tokens_issued.refresh_token
    })
  }

  const claims = await unwrapP(
    safeDecode<AccessTokenClaims>(tokens_issued.access_token)
  )

  const { jti } = claims

  const access_token_retrieved = await unwrapP(retrieveAccessToken(jti))

  if (verbose) {
    logRetrieved({
      emoji: EMOJI.ACCESS_TOKEN,
      name: 'access token',
      value: access_token_retrieved
    })
  }

  const refresh_token_retrieved = await unwrapP(
    retrieveRefreshToken(tokens_issued.refresh_token)
  )

  if (verbose) {
    logRetrieved({
      emoji: EMOJI.REFRESH_TOKEN,
      name: 'refresh token',
      value: refresh_token_retrieved
    })
  }

  console.log(`=== storage after seeding ===`)
  await logStorageState({
    client,
    filepath_access_tokens,
    filepath_authorization_codes,
    filepath_clients,
    filepath_profiles,
    filepath_refresh_tokens,
    storage
  })

  exitZero(`${__filename} finished`)
}

run()
