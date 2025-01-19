import c from 'ansi-colors'
import yargs from 'yargs/yargs'
import { unixTimestampInSeconds } from '../src/lib/date.js'
import type { Operation } from '../src/lib/storage-api/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import { unwrapP } from '../src/lib/unwrap/index.js'
import { defAjv } from '../src/ajv.js'
import { Environment, StorageBackend } from '../src/constants.js'
import { DEFAULT, LINK_BUGS } from './constants.js'
import { exitOne, exp } from './utils.js'

const USAGE = `Remove expired authorization codes, access tokens, and refresh tokens from the storage backend.`

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  .option('authorization-codes', {
    type: 'boolean',
    default: false,
    describe: 'If true, remove expired authorization codes'
  })
  .option('access-tokens', {
    type: 'boolean',
    default: false,
    describe: 'If true, remove expired access tokens'
  })
  .option('access-token-expiration', {
    type: 'string',
    default: DEFAULT.ACCESS_TOKEN_EXPIRATION,
    describe: 'Access token expiration (human readable)'
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
  .option('refresh-tokens', {
    type: 'boolean',
    default: false,
    describe: 'If true, remove expired refresh tokens'
  })
  .example(
    '$0 --backend sqlite --env dev --access-tokens',
    'Remove all expired access tokens from the SQLite development database'
  )
  .help('help')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

const run = async () => {
  const {
    accessTokenExpiration,
    accessTokens,
    authorizationCodes,
    backend,
    environment,
    refreshTokens
  } = argv

  const { error: storage_error, value: storage } = defStorage({
    ajv: defAjv(),
    backend,
    env: environment as Environment
  })

  if (storage_error) {
    return exitOne(storage_error.message)
  }

  const now = unixTimestampInSeconds()

  if (authorizationCodes) {
    const records = await unwrapP(
      storage.authorization_code.removeMany({
        where: [{ key: 'exp', op: '<', value: now }]
      })
    )
    console.log(c.green(`removed ${records.length} authorization codes`))
  }

  if (refreshTokens) {
    const records = await unwrapP(
      storage.refresh_token.removeMany({
        where: [{ key: 'exp', op: '<', value: now }]
      })
    )
    console.log(c.green(`removed ${records.length} refresh tokens`))
  }

  // Each access token record does not include the expiration time directly.
  // Instead, we store the token's creation time (in ms). Given the token's
  // validity (e.g., 3600 seconds), we can then compute its expiration time.
  if (accessTokens) {
    const retrieved = await unwrapP(
      storage.access_token.retrieveMany({ select: ['jti', 'created_at'] })
    )
    console.log(c.green(`retrieved ${retrieved.length} access tokens`))

    const expired = retrieved.filter(({ created_at }) => {
      // created_at is in ms, expires_at is in seconds
      const t0_ms = created_at as number
      const expires_at = exp(accessTokenExpiration, t0_ms)
      return expires_at < unixTimestampInSeconds()
    })

    const where = expired.map(({ jti }) => {
      return { key: 'jti', op: '==' as Operation, value: jti }
    })

    const records = await unwrapP(
      storage.access_token.removeMany({ where, condition: 'OR' })
    )
    console.log(c.green(`removed ${records.length} access tokens`))
  }
}

run()
