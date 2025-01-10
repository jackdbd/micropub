import { parseArgs } from 'node:util'
import { nanoid } from 'nanoid'
import type { SelectQuery, UpdateQuery } from '../src/lib/storage-api/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import { unwrapP } from '../src/lib/unwrap/index.js'
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
      client_id: { type: 'string', default: DEFAULT.CLIENT_ID },
      redirect_uri: { type: 'string', default: DEFAULT.REDIRECT_URI },
      reset: { type: 'boolean', default: DEFAULT.RESET },
      'show-schema': { type: 'boolean', default: DEFAULT.SHOW_SCHEMA }
    }
  })

  const { reset, 'show-schema': show_schema } = values
  const client_id = values.client_id!
  const redirect_uri = values.redirect_uri!

  const backend = values.backend! as StorageBackend
  const env = values.environment! as Environment
  const storage_key = 'access_token' as keyof HashMapSchemas

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

  const jti_to_keep = nanoid()
  const jti_to_remove = nanoid()
  const jti_to_revoke = nanoid()

  const stored = await unwrapP(
    storeOne({ client_id, jti: jti_to_keep, redirect_uri })
  )
  logRecord({
    record: stored,
    action: Action.STORED,
    schema: record_schema
  })

  await unwrapP(storeOne({ client_id, jti: jti_to_remove, redirect_uri }))
  await unwrapP(storeOne({ client_id, jti: jti_to_revoke, redirect_uri }))

  const select_query: SelectQuery = {
    where: [{ key: 'jti', op: '==', value: jti_to_keep }]
  }
  logQuery(select_query)

  const retrieved = await unwrapP(retrieveOne(select_query))
  logRecord({ record: retrieved, action: Action.RETRIEVED })

  const removed = await unwrapP(
    removeMany({
      where: [{ key: 'jti', op: '==', value: jti_to_remove }]
    })
  )
  logRecords({ records: removed, action: Action.DELETED })

  const update_query: UpdateQuery = {
    set: {
      revoked: true,
      revocation_reason: 'testing'
    },
    where: [
      {
        key: 'jti',
        op: '==',
        value: jti_to_revoke
      }
    ]
  }
  logQuery(update_query)

  const updated = await unwrapP(updateMany(update_query))
  for (const record of updated) {
    logRecord({ record, action: Action.UPDATED })
  }

  // storage implementations that use immutable records (e.g. fs-jsonl) should
  // NOT have a `deleted` property. The schema of those records have
  // `additionalProperties: false`, so if try to add the `deleted` property,
  // the validation fails.
  // const deleted = await unwrapP(
  //   deleteMany({ where: [{ key: 'revoked', op: '==', value: true }] })
  // )

  // const undeleted = await unwrapP(
  //   undeleteMany({ where: [{ key: 'revoked', op: '==', value: true }] })
  // )

  // const revoked = await unwrapP(
  //   revokeMany(
  //     { where: [{ key: 'jti', op: '==', value: retrieved.record.jti }] },
  //     'testing revoke'
  //   )
  // )

  const retrieved_all_end = await unwrapP(retrieveMany())
  logRecords({ records: retrieved_all_end, action: Action.RETRIEVED })
}

run()
