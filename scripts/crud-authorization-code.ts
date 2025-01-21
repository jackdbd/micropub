import { parseArgs } from 'node:util'
import canonicalUrl from '@jackdbd/canonical-url'
import { unwrapP } from '@jackdbd/unwrap'
import { nanoid } from 'nanoid'
import type { SelectQuery, UpdateQuery } from '../src/lib/storage-api/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import { defAjv } from '../src/ajv.js'
import {
  Environment,
  HashMapSchemas,
  StorageBackend
} from '../src/constants.js'
import { recordSchema } from '../src/record-schemas.js'

import { DEFAULT } from './constants.js'
import { logQuery, logRecord, logRecords, logSchema } from './log-as-table.js'
import { Action } from './tables.js'
import { exitOne, exp } from './utils.js'

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      backend: { type: 'string', short: 'b' },
      client_id: { type: 'string', default: DEFAULT.CLIENT_ID },
      code_challenge_method: {
        type: 'string',
        default: DEFAULT.CODE_CHALLENGE_METHOD
      },
      environment: { type: 'string', short: 'e', default: DEFAULT.ENVIRONMENT },
      expiration: {
        type: 'string',
        default: DEFAULT.AUTHORIZATION_CODE_EXPIRATION
      },
      issuer: { type: 'string', default: DEFAULT.ISSUER },
      me: { type: 'string', default: DEFAULT.ME_AFTER_CANONICALIZATION },
      redirect_uri: { type: 'string', default: DEFAULT.REDIRECT_URI },
      reset: { type: 'boolean', default: DEFAULT.RESET },
      scope: { type: 'string', default: DEFAULT.SCOPE },
      'show-schema': { type: 'boolean', default: DEFAULT.SHOW_SCHEMA }
    }
  })

  const { reset, 'show-schema': show_schema } = values
  const client_id = values.client_id!
  const code_challenge = '1234567890123456789012345678901234567890123'
  const code_challenge_method = 'S256'
  const expiration = values.expiration!
  const iss = values.issuer!
  const me = canonicalUrl(values.me!)
  const redirect_uri = values.redirect_uri!
  const scope = values.scope!

  const backend = values.backend! as StorageBackend
  const env = values.environment! as Environment
  const storage_key = 'authorization_code' as keyof HashMapSchemas

  const { error: record_schema_error, value: record_schema } = recordSchema({
    backend,
    key: storage_key
  })

  if (record_schema_error) {
    return exitOne(record_schema_error.message)
  }

  if (show_schema) {
    logSchema(record_schema)
  }

  const { error, value: storage } = defStorage({ ajv: defAjv(), backend, env })

  if (error) {
    return exitOne(error.message)
  }

  const api = storage[storage_key]

  const { removeMany, retrieveOne, retrieveMany, storeOne, updateMany } = api

  if (reset) {
    await unwrapP(removeMany())
  }

  const code_to_keep = nanoid()
  const code_to_remove = nanoid()

  const stored = await unwrapP(
    storeOne({
      client_id,
      code: code_to_keep,
      code_challenge,
      code_challenge_method,
      exp: exp(expiration),
      iss,
      me,
      redirect_uri,
      scope
    })
  )
  logRecord({
    record: stored,
    action: Action.STORED,
    schema: record_schema
  })

  const another_stored = await unwrapP(
    storeOne({
      client_id,
      code: code_to_remove,
      code_challenge,
      code_challenge_method,
      exp: exp(expiration),
      iss,
      me,
      redirect_uri,
      scope
    })
  )
  logRecord({ record: another_stored, action: Action.STORED })

  const select_query: SelectQuery = {
    select: ['code', 'exp', 'scope', 'used'],
    // select: ['rowid', '*'],
    where: [{ key: 'code', op: '==', value: code_to_keep }],
    condition: 'OR'
  }
  logQuery(select_query)

  const retrieved = await unwrapP(retrieveOne(select_query))
  logRecord({ record: retrieved, action: Action.RETRIEVED })

  const retrieved_all_begin = await unwrapP(retrieveMany())
  logRecords({ records: retrieved_all_begin, action: Action.RETRIEVED })
  for (const record of retrieved_all_begin) {
    logRecord({ record, action: Action.RETRIEVED })
  }

  const removed = await unwrapP(
    removeMany({
      where: [{ key: 'code', op: '==', value: code_to_remove }]
    })
  )
  logRecords({ records: removed, action: Action.DELETED })

  const update_query: UpdateQuery = {
    set: {
      exp: exp('3 days')
    },
    where: [
      {
        key: 'code',
        op: '==',
        value: code_to_keep
      }
    ]
  }
  logQuery(update_query)

  const updated = await unwrapP(updateMany(update_query))
  for (const record of updated) {
    logRecord({ record, action: Action.UPDATED })
  }

  // const removed_all = await unwrapP(removeMany())
  // logRecords({ records: removed_all, action: Action.DELETED })

  const retrieved_all_end = await unwrapP(retrieveMany())
  logRecords({ records: retrieved_all_end, action: Action.RETRIEVED })
}

run()
