import yargs from 'yargs/yargs'
import type { TestExpression } from '../src/lib/storage-api/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import { defAjv } from '../src/ajv.js'
import { Environment, StorageBackend } from '../src/constants.js'
import { DEFAULT, LINK_BUGS } from './constants.js'
import { exitOne } from './utils.js'
import { unwrapP } from '../src/lib/unwrap/index.js'

const USAGE = `
Revoke access tokens and refresh tokens stored in the specified storage backend.`

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
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
  .option('revocation-reason', {
    describe:
      'Reason for revoking the tokens (e.g. "logout", "refreshed", "security_breach", "testing"',
    type: 'string'
  })
  .option('revoke-all', {
    boolean: true,
    describe: 'If true, revoke all access tokens and all refresh tokens',
    default: false
  })
  .example(
    '$0 --backend sqlite -e dev',
    'Revoke tokens stored in a local SQLite database'
  )
  .example(
    '$0 -b fs-jsonl --revoke-all --revocation-reason "testing token revocation"',
    'Revoke all access tokens and all refresh tokens stored in a JSON Lines file'
  )
  .help('help')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

const run = async () => {
  const { backend, environment, revokeAll } = argv

  const revocation_reason = argv['revocation-reason']

  const ajv = defAjv()

  const { error: storage_error, value: storage } = defStorage({
    ajv,
    backend,
    env: environment as Environment
  })

  if (storage_error) {
    return exitOne(storage_error.message)
  }

  const access_tokens = await unwrapP(storage.access_token.retrieveMany())

  const jtis = access_tokens.map((record) => record.jti)

  const where = {
    access_tokens: [] as TestExpression[],
    refresh_tokens: [] as TestExpression[]
  }
  if (revokeAll) {
    where.access_tokens = jtis.map((jti) => {
      return { key: 'jti', op: '==', value: jti }
    })
    where.refresh_tokens = jtis.map((jti) => {
      return { key: 'jti', op: '==', value: jti }
    })
  } else {
    where.access_tokens = [
      { key: 'jti', op: '==', value: jtis[0] },
      { key: 'jti', op: '==', value: jtis[1] }
    ]
    where.refresh_tokens = [{ key: 'jti', op: '==', value: jtis[0] }]
  }

  const returning_access_token_records = await unwrapP(
    storage.access_token.updateMany({
      where: where.access_tokens,
      set: { revoked: true, revocation_reason },
      condition: 'OR',
      returning: ['*']
    })
  )
  console.log(`revoked ${returning_access_token_records.length} access tokens`)
  console.log(returning_access_token_records)

  // const refresh_tokens = await unwrapP(storage.refresh_token.retrieveMany())

  const returning_refresh_token_records = await unwrapP(
    storage.refresh_token.updateMany({
      where: where.refresh_tokens,
      set: { revoked: true, revocation_reason },
      condition: 'OR',
      returning: [
        'refresh_token',
        'jti',
        'scope',
        'revoked',
        'revocation_reason'
      ]
    })
  )
  console.log(
    `revoked ${returning_refresh_token_records.length} refresh tokens`
  )
  console.log(returning_refresh_token_records)
}

run()
