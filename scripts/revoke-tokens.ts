import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type Client } from '@libsql/client'
import { defAtom } from '@thi.ng/atom'
import yargs from 'yargs/yargs'
import type {
  AccessTokenTable,
  RefreshTokenTable
} from '../src/lib/token-storage-interface/index.js'
import { updateRecords } from '../src/lib/fs-storage/index.js'
import { defUpdateRecords } from '../src/lib/sqlite-storage/index.js'
import { DATABASES, DEFAULT, EMOJI, LINK_BUGS } from './constants.js'
import { exitOne, logStorageState, unwrapP } from './utils.js'

const USAGE = `
Revoke tokens stored in the specified storage layer.
This script can revoke access tokens and/or refresh tokens.`

const atom_access_tokens = defAtom<AccessTokenTable>({})
const atom_refresh_tokens = defAtom<RefreshTokenTable>({})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')
const filepath_access_tokens = path.join(assets_dir, 'access-tokens.json')
const filepath_refresh_tokens = path.join(assets_dir, 'refresh-tokens.json')

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  .option('access-tokens', {
    boolean: true,
    describe: 'If true, revoke all access tokens'
  })
  .option('refresh-tokens', {
    boolean: true,
    describe: 'If true, revoke all refresh tokens'
  })
  .option('revocation-reason', {
    describe:
      'Reason for revoking the tokens (e.g. "logout", "refreshed", "security_breach", "testing"',
    type: 'string'
  })
  .option('storage', {
    alias: 's',
    demandOption: true,
    describe: 'Storage backend',
    choices: ['fs', 'mem', 'sqlite-dev', 'sqlite-prod'],
    type: 'string'
  })
  .option('verbose', {
    boolean: true,
    default: DEFAULT.VERBOSE,
    describe: 'If true, produce verbose output (i.e. log more stuff'
  })
  .example('$0 --storage fs', 'Revoke tokens stored in the filesystem')
  .example(
    '$0 -s sqlite-dev --verbose',
    "Revoke tokens stored in the 'sqlite-dev' database, produce a verbose output"
  )
  .help('help')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

const run = async () => {
  const {
    accessTokens: revoke_access_tokens,
    refreshTokens: revoke_refresh_tokens,
    revocationReason: revocation_reason,
    storage,
    verbose
  } = argv

  //   const revoked = false
  const revoked = true

  let client: Client | undefined

  switch (storage) {
    case 'fs': {
      if (revoke_access_tokens) {
        console.log(`${EMOJI.ACCESS_TOKEN} revoking access tokens`)
        const { message, patches } = await unwrapP(
          updateRecords({
            id: 'jti',
            filepath: filepath_access_tokens,
            set: { revoked, revocation_reason }
          })
        )

        console.log(message)
        if (verbose && patches.length > 0) {
          console.log(patches)
        }
      }

      if (revoke_refresh_tokens) {
        console.log(`${EMOJI.REFRESH_TOKEN} revoking refresh tokens`)
        const { message, patches } = await unwrapP(
          updateRecords({
            id: 'refresh_token',
            filepath: filepath_refresh_tokens,
            set: { revoked, revocation_reason }
          })
        )
        console.log(message)
        if (verbose && patches.length > 0) {
          console.log(patches)
        }
      }

      break
    }

    case 'sqlite-dev': {
      client = createClient(DATABASES.DEV)

      if (revoke_access_tokens) {
        const updateRecords = defUpdateRecords({
          client,
          table_name: 'access_tokens',
          returning: ['jti', 'rowid']
        })

        console.log(`${EMOJI.ACCESS_TOKEN} revoking access tokens`)
        const { message, rows, sql } = await unwrapP(
          updateRecords({ revoked, revocation_reason })
        )

        console.log(message)
        if (verbose) {
          console.log(sql)
          if (rows.length > 0) {
            console.log(rows)
          }
        }
      }

      if (revoke_refresh_tokens) {
        const updateRecords = defUpdateRecords({
          client,
          table_name: 'refresh_tokens',
          returning: ['refresh_token', 'rowid']
        })

        console.log(`${EMOJI.REFRESH_TOKEN} revoking refresh tokens`)
        const { message, rows, sql } = await unwrapP(
          updateRecords({ revoked, revocation_reason })
        )

        console.log(message)
        if (verbose) {
          console.log(sql)
          if (rows.length > 0) {
            console.log(rows)
          }
        }
      }

      break
    }

    // case 'sqlite-prod': {
    //   client = createClient(DATABASES.PROD)
    //   break
    // }

    default: {
      exitOne(`revoking tokens from storage '${storage}' is not implemented`)
      return
    }
  }

  console.log(`=== storage after revoking ===`)
  await logStorageState({
    atom_access_tokens,
    atom_refresh_tokens,
    client,
    filepath_access_tokens,
    filepath_refresh_tokens,
    storage
  })
}

run()
