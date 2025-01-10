import { Type } from '@sinclair/typebox'
import { defAtom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  ATOM_RECORD_KEY,
  Environment,
  HashMapSchemas,
  StorageBackend
} from '../../constants.js'
import {
  defRemoveRecords,
  defRetrieveRecord,
  defRetrieveRecords,
  defStoreRecord,
  defUpdateRecords
} from '../mem-atom-storage/api.js'
import { PROPS_SCHEMAS } from '../../props-schemas.js'
import { hashMapRecordSchemas } from '../../record-schemas.js'
import type { StorageApi } from '../storage-api/index.js'
// import type { AccessTokenMutableRecord } from '../storage-api/schemas.js'

// TypeScript does not like this
// export const ATOM = {
//   access_token: defAtom<Record<string, AccessTokenMutableRecord>>({}),
// }

// TypeScript does not like this
// export const ATOM: Record<
//   keyof HashMapSchemas,
//   Atom<Record<string, BaseRecord>>
// > = {
//   access_token: defAtom({}),
// }

export const ATOM = {
  access_token: defAtom({}),
  authorization_code: defAtom({}),
  client_application: defAtom({}),
  refresh_token: defAtom({}),
  user_profile: defAtom({})
}

export interface Config {
  ajv: Ajv
  env: Environment
}

export const implementation = (config: Config) => {
  const { ajv, env } = config

  if (env !== 'dev') {
    return {
      error: new Error(
        `storage backend fs-json only supports a dev environment`
      )
    }
  }

  const { error, value } = hashMapRecordSchemas(StorageBackend['mem-atom'])

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
    const atom = ATOM[key]
    const record_key = ATOM_RECORD_KEY[key]

    const removeRecords = defRemoveRecords({ atom, record_key })

    const retrieveRecord = defRetrieveRecord({
      ajv,
      atom,
      schema: record_schema
    })

    const retrieveRecords = defRetrieveRecords({
      ajv,
      atom,
      schema: Type.Array(record_schema)
    })

    const storeRecord = defStoreRecord({
      ajv,
      atom,
      record_key,
      schema_props,
      schema_record: record_schema
    })

    const updateRecords = defUpdateRecords({
      ajv,
      atom,
      record_key,
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
