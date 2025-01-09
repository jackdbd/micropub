import { fileURLToPath } from 'node:url'
import { type Client as LibSqlClient } from '@libsql/client'
import type { TSchema } from '@sinclair/typebox'
import type { Atom } from '@thi.ng/atom'
import type { ValidateFunction } from 'ajv'
import c from 'ansi-colors'
import * as jose from 'jose'
import { table, type Alignment } from 'table'
import * as DEFAULT from '../src/defaults.js'
import { readJSON } from '../src/lib/fs-storage/json.js'
import type { CodeTable } from '../src/lib/authorization-code-storage-interface/index.js'
import type { ClientTable } from '../src/lib/clients-storage-interface/index'
import type { ProfileTable } from '../src/lib/profile-storage-interface/index.js'
import type {
  AccessTokenTable,
  RefreshTokenTable
} from '../src/lib/token-storage-interface/index.js'
import { EMOJI } from './constants.js'
import {
  ACCESS_TOKEN_RECORD_KEYS,
  AUTHORIZATION_CODE_RECORD_KEYS,
  CLIENT_APPLICATION_RECORD_KEYS,
  REFRESH_TOKEN_RECORD_KEYS,
  USER_PROFILE_RECORD_KEYS
} from '../src/constants.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename

const jwks_private = DEFAULT.JWKS
if (!jwks_private) {
  throw new Error('JWKS not set')
}
export const JWKS = JSON.parse(jwks_private)

export const privateJWKS = async () => {
  // In some environments (e.g. Fly.io) we need to set JWKS as an escaped JSON
  // string (e.g. "{\"keys\":[]}"). So in those environments we need to call
  // JSON.parse twice to build the actual JS object.
  let jwks: { keys: jose.JWK[] } = JSON.parse(DEFAULT.JWKS!)
  if (typeof jwks === 'string') {
    jwks = JSON.parse(jwks)
  }
  return jwks
}

export const check = (what: string, value: any, validate: ValidateFunction) => {
  const valid = validate(value)
  console.log(`is '${what}' valid?`, valid)

  // console.log('value after validation (and after defaults when Ajv useDefaults: true)')
  // console.log(value)

  if (validate.errors) {
    validate.errors.forEach((error, i) => {
      console.error(`❌ validation error ${i + 1} in '${what}'`, error)
    })
  }
}

export const describe = (schema: TSchema) => {
  const entries = Object.entries(schema.properties).map(([key, x]) => {
    const val = JSON.stringify(x, null, 2)
    return [key, val]
  })

  const header_content = `JSON schema '${schema.title}' ($id: ${schema.$id})`

  console.log(
    table(entries, { header: { alignment: 'center', content: header_content } })
  )
  console.log('\n')
}

type Result<V, E extends Error = Error> =
  | { error: E; value?: undefined }
  | { error?: undefined; value: V }

export const unwrap = <V, E extends Error = Error>(result: Result<V, E>) => {
  const { error, value } = result
  if (error) {
    console.error(c.red(`${EMOJI.ERROR} ${error.message}`))
    process.exit(1)
  }
  if (!value) {
    console.error(c.red(`${EMOJI.ERROR} value is undefined`))
    process.exit(1)
  }
  return value
}

export const unwrapP = async <V, E extends Error = Error>(
  promise: Promise<Result<V, E>>
) => {
  const result = await promise
  return unwrap(result)
}

interface LogRecordConfig {
  emoji: string
  name: string
  value: any
}

export const logRetrieved = ({ emoji, name, value }: LogRecordConfig) => {
  console.log(`${EMOJI.RETRIEVED} ${c.green('record retrieved')}`)
  console.log(`${emoji} ${name}`, value)
}

export const logStored = ({ emoji, name, value }: LogRecordConfig) => {
  console.log(`${EMOJI.STORED} ${c.green('record stored')}`)
  console.log(`${emoji} ${name}`, value)
}

export const exitOne = (message: string) => {
  console.error(c.red(`${EMOJI.EXIT_ONE} ${message}`))
  process.exit(1)
}

export const exitZero = (message: string) => {
  console.log(c.green(`${EMOJI.EXIT_ZERO} ${message}`))
  process.exit(0)
}

interface LogStorageStateConfig {
  client?: LibSqlClient
  atom_access_tokens?: Atom<AccessTokenTable>
  atom_authorization_codes?: Atom<CodeTable>
  atom_clients?: Atom<ClientTable>
  atom_profiles?: Atom<ProfileTable>
  atom_refresh_tokens?: Atom<RefreshTokenTable>
  filepath_access_tokens?: string
  filepath_authorization_codes?: string
  filepath_clients?: string
  filepath_profiles?: string
  filepath_refresh_tokens?: string
  storage: string
}

interface TableEntriesConfig {
  data: { [key: string]: any }
  keys: string[]
}

const tableEntries = (config: TableEntriesConfig) => {
  const { data, keys } = config

  const entries = Object.entries(data).reduce(
    (acc, cv) => {
      const [id, m] = cv

      const record = keys.reduce((acc, k, i) => {
        let val: string
        if (i === 0) {
          val = id
        } else {
          val = m[k]
        }
        // console.log(`${EMOJI.DEBUG} ${k}: ${val}`)
        return { ...acc, [k]: val }
      }, {})

      const values: string[] = Object.values(record)
      return [...acc, values]
    },
    [keys]
  )

  return entries
}

interface LogTableConfig {
  data: { [key: string]: any }
  header: {
    alignment?: Alignment
    content: string
    keys: string[]
  }
}

const logTable = (config: LogTableConfig) => {
  const { data, header } = config
  const alignment = config.header.alignment || 'center'
  const { keys } = header

  const entries = tableEntries({ data, keys })
  const content = `${header.content} (${entries.length - 1} records)`

  const columnDefault = {
    width: 15
  }

  console.log(
    table(entries, {
      columnDefault,
      header: { alignment, content }
    })
  )
}

/**
 * Logs the current state of the storage layer.
 */
export const logStorageState = async (config: LogStorageStateConfig) => {
  const {
    client,
    atom_access_tokens,
    atom_authorization_codes,
    atom_clients,
    atom_profiles,
    atom_refresh_tokens,
    filepath_access_tokens,
    filepath_authorization_codes,
    filepath_clients,
    filepath_profiles,
    filepath_refresh_tokens,
    storage
  } = config

  const prefix = '[logStorageState] '

  switch (storage) {
    case 'fs': {
      if (filepath_access_tokens) {
        const data = await unwrapP<AccessTokenTable>(
          readJSON(filepath_access_tokens)
        )

        logTable({
          data,
          header: {
            content: 'Access Tokens',
            keys: ACCESS_TOKEN_RECORD_KEYS
          }
        })
      }

      if (filepath_authorization_codes) {
        const data = await unwrapP<CodeTable>(
          readJSON(filepath_authorization_codes)
        )

        logTable({
          data,
          header: {
            content: 'Authorization Codes',
            keys: AUTHORIZATION_CODE_RECORD_KEYS
          }
        })
      }

      if (filepath_clients) {
        const data = await unwrapP<ClientTable>(readJSON(filepath_clients))
        logTable({
          data,
          header: {
            content: 'Client Applications',
            keys: CLIENT_APPLICATION_RECORD_KEYS
          }
        })
      }

      if (filepath_profiles) {
        const data = await unwrapP<ProfileTable>(readJSON(filepath_profiles))

        logTable({
          data,
          header: {
            content: 'User Profiles',
            keys: USER_PROFILE_RECORD_KEYS
          }
        })
      }

      if (filepath_refresh_tokens) {
        const data = await unwrapP<RefreshTokenTable>(
          readJSON(filepath_refresh_tokens)
        )

        logTable({
          data,
          header: {
            content: 'Refresh Tokens',
            keys: REFRESH_TOKEN_RECORD_KEYS
          }
        })
      }

      break
    }

    case 'mem': {
      if (atom_access_tokens) {
        const data = atom_access_tokens.deref()
        logTable({
          data,
          header: {
            content: 'Access Tokens',
            keys: ACCESS_TOKEN_RECORD_KEYS
          }
        })
      }

      if (atom_authorization_codes) {
        const data = atom_authorization_codes.deref()
        logTable({
          data,
          header: {
            content: 'Authorization Codes',
            keys: AUTHORIZATION_CODE_RECORD_KEYS
          }
        })
      }

      if (atom_clients) {
        const data = atom_clients.deref()
        logTable({
          data,
          header: {
            content: 'Client Applications',
            keys: CLIENT_APPLICATION_RECORD_KEYS
          }
        })
      }

      if (atom_profiles) {
        const data = atom_profiles.deref()
        logTable({
          data,
          header: {
            content: 'User Profiles',
            keys: USER_PROFILE_RECORD_KEYS
          }
        })
      }

      if (atom_refresh_tokens) {
        const data = atom_refresh_tokens.deref()
        logTable({
          data,
          header: {
            content: 'Refresh Tokens',
            keys: REFRESH_TOKEN_RECORD_KEYS
          }
        })
      }
      break
    }

    case 'sqlite-dev':
    case 'sqlite-prod': {
      if (!client) {
        exitOne(`${prefix}LibSQL client is undefined`)
        return
      }

      const rs_at = await client.execute(
        'SELECT COUNT(*) as total FROM access_tokens'
      )
      console.log(`${rs_at.rows[0]['total']} access tokens in DB`)
      const rs_access = await client.execute(
        'SELECT rowid,* FROM access_tokens'
      )
      // for (const row of rs_access.rows) {
      //   console.log(row)
      // }
      logTable({
        data: rs_access.rows,
        header: {
          content: 'Access Tokens',
          keys: ['rowid', ...ACCESS_TOKEN_RECORD_KEYS]
        }
      })

      const rs_ac = await client.execute(
        'SELECT COUNT(*) as total FROM authorization_codes'
      )
      console.log(`${rs_ac.rows[0]['total']} authorization codes in DB`)

      const rs_c = await client.execute('SELECT COUNT(*) as total FROM clients')
      console.log(`${rs_c.rows[0]['total']} clients in DB`)

      const rs_p = await client.execute(
        'SELECT COUNT(*) as total FROM profiles'
      )
      console.log(`${rs_p.rows[0]['total']} user profiles in DB`)
      // const rs_profiles = await client.execute('SELECT * FROM profiles')
      // for (const row of rs_profiles.rows) {
      //   console.log(row)
      // }

      const rs_rt = await client.execute(
        'SELECT COUNT(*) as total FROM refresh_tokens'
      )
      console.log(`${rs_rt.rows[0]['total']} refresh tokens in DB`)
      const rs_refresh = await client.execute(
        'SELECT rowid,* FROM refresh_tokens'
      )
      // for (const row of rs_refresh.rows) {
      //   console.log(row)
      // }
      logTable({
        data: rs_refresh.rows,
        header: {
          content: 'Refresh Tokens',
          keys: ['rowid', ...REFRESH_TOKEN_RECORD_KEYS]
        }
      })

      break
    }
    default: {
      exitOne(
        `${prefix}logging the current state of storage '${storage}' is not implemented`
      )
      return
    }
  }
}
