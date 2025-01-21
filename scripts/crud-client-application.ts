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
import { exitOne } from './utils.js'

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      backend: { type: 'string', short: 'b' },
      environment: { type: 'string', short: 'e', default: DEFAULT.ENVIRONMENT },
      reset: { type: 'boolean', default: DEFAULT.RESET },
      'show-schema': { type: 'boolean', default: DEFAULT.SHOW_SCHEMA }
    }
  })

  const { reset, 'show-schema': show_schema } = values
  const backend = values.backend! as StorageBackend
  const env = values.environment! as Environment
  const storage_key = 'client_application' as keyof HashMapSchemas
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

  const me_aaron = 'https://aaronparecki.com/'
  const me_giacomo = canonicalUrl('giacomodebidda.com')

  const stored = await unwrapP(
    storeOne({
      client_id: 'https://micropub.giacomodebidda.com/id',
      me: me_giacomo,
      redirect_uri: 'https://micropub.giacomodebidda.com/auth/callback'
    })
  )
  logRecord({
    record: stored,
    action: Action.STORED,
    schema: record_schema
  })

  const another_stored = await unwrapP(
    storeOne({
      client_id: 'https://quill.p3k.io/id',
      me: me_aaron,
      redirect_uri: 'https://quill.p3k.io/auth/callback'
    })
  )
  logRecord({ record: another_stored, action: Action.STORED })

  const select_query: SelectQuery = {
    where: [{ key: 'me', op: '==', value: me_giacomo }]
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
      where: [{ key: 'me', op: '==', value: me_aaron }]
    })
  )
  logRecords({ records: removed, action: Action.DELETED })

  const update_query: UpdateQuery = {
    set: {
      redirect_uri: `https://some-domain.com/${nanoid()}/auth/callback`
    },
    where: [
      {
        key: 'me',
        op: '==',
        value: me_giacomo
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
