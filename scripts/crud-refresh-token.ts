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
import { exitOne, exp } from './utils.js'

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      backend: { type: 'string', short: 'b' },
      client_id: { type: 'string', default: DEFAULT.CLIENT_ID },
      environment: { type: 'string', short: 'e', default: DEFAULT.ENVIRONMENT },
      expiration: { type: 'string', default: DEFAULT.REFRESH_TOKEN_EXPIRATION },
      iss: { type: 'string', default: DEFAULT.ISSUER },
      me: { type: 'string', default: DEFAULT.ME_AFTER_CANONICALIZATION },
      redirect_uri: { type: 'string', default: DEFAULT.REDIRECT_URI },
      reset: { type: 'boolean', default: DEFAULT.RESET },
      scope: { type: 'string', default: DEFAULT.SCOPE },
      'show-schema': { type: 'boolean', default: DEFAULT.SHOW_SCHEMA }
    }
  })

  const { reset, 'show-schema': show_schema } = values
  const client_id = values.client_id!
  const expiration = values.expiration!
  const iss = values.iss!
  const me = values.me!
  const redirect_uri = values.redirect_uri!
  const scope = values.scope!

  const backend = values.backend! as StorageBackend
  const env = values.environment! as Environment
  const storage_key = 'refresh_token' as keyof HashMapSchemas

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

  const refresh_token_to_keep = nanoid()
  const refresh_token_to_remove = nanoid()
  const refresh_token_to_revoke = nanoid()

  const props = {
    jti: nanoid(),
    client_id,
    exp: exp(expiration),
    iss,
    me,
    redirect_uri,
    scope
  }

  const stored = await unwrapP(
    storeOne({ ...props, refresh_token: refresh_token_to_keep })
  )
  logRecord({
    record: stored,
    action: Action.STORED,
    schema: record_schema
  })

  await unwrapP(storeOne({ ...props, refresh_token: refresh_token_to_remove }))
  await unwrapP(storeOne({ ...props, refresh_token: refresh_token_to_revoke }))

  const select_query: SelectQuery = {
    where: [{ key: 'refresh_token', op: '==', value: refresh_token_to_keep }]
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
      where: [
        { key: 'refresh_token', op: '==', value: refresh_token_to_remove }
      ]
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
        key: 'refresh_token',
        op: '==',
        value: refresh_token_to_revoke
      }
    ]
  }
  logQuery(update_query)

  const updated = await unwrapP(updateMany(update_query))
  for (const record of updated) {
    logRecord({ record, action: Action.UPDATED })
  }

  // const deleted = await unwrapP(
  //   deleteMany({ where: [{ key: 'revoked', op: '==', value: true }] })
  // )
  // logRecordIds({ records: deleted.records, operation: 'deleted' })

  // const undeleted = await unwrapP(
  //   undeleteMany({ where: [{ key: 'revoked', op: '==', value: true }] })
  // )

  // const revoked = await unwrapP(
  //   revokeMany(
  //     { where: [{ key: 'jti', op: '==', value: retrieved.record.jti }] },
  //     'testing revoke'
  //   )

  const retrieved_all_end = await unwrapP(retrieveMany())
  logRecords({ records: retrieved_all_end, action: Action.RETRIEVED })
}

run()
