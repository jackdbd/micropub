import { createClient } from '@libsql/client'
import type Ajv from 'ajv'
import {
  SQLITE_DATABASE,
  SQLITE_DATABASE_TABLE,
  StorageBackend,
  HashMapSchemas,
  Environment
} from '../../constants.js'
import { PROPS_SCHEMAS } from '../../props-schemas.js'
import { hashMapRecordSchemas } from '../../record-schemas.js'
import type { StorageApi } from '../storage-api/index.js'
import * as sqlite from '../sqlite-storage/api.js'

export interface Config {
  ajv: Ajv
  env: Environment
}

export const implementation = (config: Config) => {
  const { ajv, env } = config

  const client = createClient(SQLITE_DATABASE[env])

  const { error, value } = hashMapRecordSchemas(StorageBackend.sqlite)

  if (error) {
    return { error }
  }

  const apis: Record<keyof HashMapSchemas, StorageApi> = {
    access_token: {} as StorageApi,
    authorization_code: {} as StorageApi,
    client_application: {} as StorageApi,
    refresh_token: {} as StorageApi,
    user_profile: {} as StorageApi
  }

  for (const [k, record_schema] of Object.entries(value)) {
    const key = k as keyof HashMapSchemas
    const props_schema = PROPS_SCHEMAS[key]
    const table = SQLITE_DATABASE_TABLE[key] as string

    const removeRecords = sqlite.defRemoveRecords({ client, table })

    const retrieveRecord = sqlite.defRetrieveRecord({ client, table })

    const retrieveRecords = sqlite.defRetrieveRecords({ client, table })

    const storeRecord = sqlite.defStoreRecord({
      ajv,
      client,
      schema_before: props_schema,
      schema_after: record_schema,
      table
    })

    const updateRecords = sqlite.defUpdateRecords({ client, table })

    apis[key] = {
      removeMany: removeRecords,
      retrieveOne: retrieveRecord,
      retrieveMany: retrieveRecords,
      storeOne: storeRecord,
      updateMany: updateRecords
    }
  }

  return { value: apis }
}
