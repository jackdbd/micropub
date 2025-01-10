import { Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  Environment,
  HashMapSchemas,
  JSON_LINES_FILEPATH,
  StorageBackend
} from '../../constants.js'
import { PROPS_SCHEMAS } from '../../props-schemas.js'
import { hashMapRecordSchemas } from '../../record-schemas.js'
import type { StorageApi } from '../storage-api/index.js'
import * as jsonl from '../fs-jsonl-storage/api.js'

export interface Config {
  ajv: Ajv
  env: Environment
}

export const implementation = (config: Config) => {
  const { ajv, env } = config

  if (env !== 'dev') {
    return {
      error: new Error(
        `storage backend fs-jsonl only supports a dev environment`
      )
    }
  }

  const { error, value } = hashMapRecordSchemas(StorageBackend['fs-jsonl'])

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
    const schema_props = PROPS_SCHEMAS[key]
    const filepath = JSON_LINES_FILEPATH[key]

    const removeRecords = jsonl.defRemoveRecords({ filepath })

    const retrieveRecord = jsonl.defRetrieveRecord({
      ajv,
      filepath,
      schema: record_schema
    })

    const retrieveRecords = jsonl.defRetrieveRecords({
      ajv,
      filepath,
      schema: Type.Array(record_schema)
    })

    const storeRecord = jsonl.defStoreRecord({
      ajv,
      filepath,
      schema_props,
      schema_record: record_schema
    })

    const updateRecords = jsonl.defUpdateRecords({
      ajv,
      filepath,
      schema: Type.Array(record_schema)
    })

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
