import yargs from 'yargs/yargs'
import { defAjv } from '../src/ajv.js'
import { accessToken, refreshToken } from '../src/lib/issue-tokens/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import { type AccessTokenClaims, safeDecode } from '../src/lib/token/index.js'
import type {
  AccessTokenProps,
  RefreshTokenProps
} from '../src/lib/token-storage-interface/index.js'
import { unwrapP } from '../src/lib/unwrap/index.js'
import { canonicalUrl } from '../src/lib/url-canonicalization.js'
import {
  Environment,
  SQLITE_DATABASE_TABLE,
  StorageBackend
} from '../src/constants.js'
import { defSQLiteUtils } from '../src/sqlite-utils.js'
import {
  DEFAULT,
  INDIEAUTH_SCOPES,
  LINK_BUGS,
  MICROPUB_SCOPES
} from './constants.js'
import { EMOJI } from './emojis.js'
import { exitOne, privateJWKS } from './utils.js'

const SCOPES = [...INDIEAUTH_SCOPES, ...MICROPUB_SCOPES]

const USAGE = `Issue access tokens and refresh tokens.`

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  .option('access-token-expiration', {
    describe: 'Access token expiration (human readable)',
    default: DEFAULT.ACCESS_TOKEN_EXPIRATION,
    type: 'string'
  })
  .option('backend', {
    alias: 'b',
    demandOption: true,
    describe: 'Storage backend',
    choices: Object.keys(StorageBackend),
    type: 'string'
  })
  .option('environment', {
    alias: 'e',
    describe: 'Environment',
    choices: ['dev', 'prod'],
    default: DEFAULT.ENVIRONMENT,
    type: 'string'
  })
  .option('client-id', {
    describe: 'If true, add a user profile about myself',
    default: DEFAULT.CLIENT_ID,
    type: 'string'
  })
  .option('issuer', {
    describe: 'Issuer of authorization codes, access tokens and refresh tokens',
    default: DEFAULT.ISSUER,
    type: 'string'
  })
  .option('me', {
    describe: 'User profile URL (before or after URL canonicalization)',
    default: DEFAULT.ME_BEFORE_CANONICALIZATION,
    type: 'string'
  })
  .option('redirect-uri', {
    describe: 'Redirect URI (before or after URL canonicalization)',
    default: DEFAULT.REDIRECT_URI,
    type: 'string'
  })
  .option('refresh-token-expiration', {
    describe: 'Refresh token expiration (human readable)',
    default: DEFAULT.REFRESH_TOKEN_EXPIRATION,
    type: 'string'
  })
  .example(
    '$0 --backend fs-jsonl',
    `Issue an access token that expires in ${DEFAULT.ACCESS_TOKEN_EXPIRATION} and a refresh token that expires in ${DEFAULT.REFRESH_TOKEN_EXPIRATION}, store them in a JSON Lines file`
  )
  .example(
    '$0 -b sqlite -e dev --access-token-expiration "72 hours" --refresh-token-expiration "1 year"',
    'Issue an access token that expires in 72 hours and a refresh token that expires in 1 year, store them in a local SQLite database'
  )
  .help('info')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

const run = async () => {
  const {
    accessTokenExpiration,
    backend,
    clientId: client_id,
    environment,
    issuer,
    refreshTokenExpiration
  } = argv

  const me = canonicalUrl(argv.me)
  const redirect_uri = canonicalUrl(argv['redirect-uri'])

  const jwks = await privateJWKS()

  const ajv = defAjv()

  const log = {
    debug: (msg: string, payload?: any) => {
      if (payload) {
        console.log(`${EMOJI.DEBUG} ${msg}`, payload)
      } else {
        console.log(`${EMOJI.DEBUG} ${msg}`)
      }
    }
  }

  const { access_token } = await unwrapP(
    accessToken({
      ajv,
      expiration: accessTokenExpiration,
      issuer,
      log,
      jwks,
      me,
      scope: SCOPES.join(' ')
    })
  )

  const claims = await unwrapP(safeDecode<AccessTokenClaims>(access_token))

  const { jti, scope } = claims

  const access_token_props: AccessTokenProps = {
    client_id,
    jti,
    redirect_uri
  }

  const { exp, refresh_token } = await unwrapP(
    refreshToken({
      ajv,
      expiration: refreshTokenExpiration,
      log
    })
  )

  const refresh_token_props: RefreshTokenProps = {
    client_id,
    exp,
    iss: issuer,
    jti,
    me,
    redirect_uri,
    refresh_token,
    scope
  }

  log.debug(`persist to storage these properties about the tokens`, {
    access_token: access_token_props,
    refresh_token: refresh_token_props
  })

  const { error: storage_error, value: storage } = defStorage({
    ajv,
    backend,
    env: environment as Environment
  })

  if (storage_error) {
    return exitOne(storage_error.message)
  }

  if (backend === StorageBackend.sqlite) {
    log.debug(
      `storing access token and refresh token in ${backend} [${environment}] using a transaction`
    )

    const { batchTransaction } = defSQLiteUtils({
      env: environment as Environment
    })

    const { error, value } = await batchTransaction({
      inserts: [
        {
          table: SQLITE_DATABASE_TABLE.access_token,
          props: access_token_props
        },
        {
          table: SQLITE_DATABASE_TABLE.refresh_token,
          props: refresh_token_props
        }
      ]
    })

    if (error) {
      return exitOne(error.message)
    }

    log.debug(value.message)
  } else {
    log.debug(`storing access token in ${backend} [${environment}]`)
    await unwrapP(storage.access_token.storeOne(access_token_props))
    log.debug(`stored access token`)

    log.debug(`storing refresh token in ${backend} [${environment}]`)
    await unwrapP(storage.refresh_token.storeOne(refresh_token_props))
    log.debug(`stored refresh token`)
  }
}

run()
