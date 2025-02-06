import {
  access_token_immutable_record,
  access_token_mutable_record,
  authorization_code_immutable_record,
  authorization_code_mutable_record,
  refresh_token_immutable_record,
  refresh_token_mutable_record,
  user_profile_immutable_record,
  user_profile_mutable_record
} from '@jackdbd/indieauth/schemas/index'
import {
  client_application_immutable_record,
  client_application_mutable_record
} from './lib/storage-api/schemas.js'
import type { HashMapSchemas, StorageBackend } from './constants.js'

export const RECORD_SCHEMAS: Record<StorageBackend, HashMapSchemas> = {
  'fs-json': {
    access_token: access_token_mutable_record,
    authorization_code: authorization_code_mutable_record,
    client_application: client_application_mutable_record,
    refresh_token: refresh_token_mutable_record,
    user_profile: user_profile_mutable_record
  },
  'fs-jsonl': {
    access_token: access_token_immutable_record,
    authorization_code: authorization_code_immutable_record,
    client_application: client_application_immutable_record,
    refresh_token: refresh_token_immutable_record,
    user_profile: user_profile_immutable_record
  },
  'mem-atom': {
    access_token: access_token_mutable_record,
    authorization_code: authorization_code_mutable_record,
    client_application: client_application_mutable_record,
    refresh_token: refresh_token_mutable_record,
    user_profile: user_profile_mutable_record
  },
  sqlite: {
    access_token: access_token_mutable_record,
    authorization_code: authorization_code_mutable_record,
    client_application: client_application_mutable_record,
    refresh_token: refresh_token_mutable_record,
    user_profile: user_profile_mutable_record
  }
}

export interface RecordSchemaConfig {
  backend: StorageBackend
  key: keyof HashMapSchemas
}

export const recordSchema = (config: RecordSchemaConfig) => {
  const { backend, key } = config

  if (!RECORD_SCHEMAS[backend]) {
    return {
      error: new Error(
        `storage backend '${backend}' does not define schemas for its records`
      )
    }
  }

  const schema = RECORD_SCHEMAS[backend][key]
  if (!schema) {
    return {
      error: new Error(
        `storage backend '${backend}' does not define a schema for the record '${key}'`
      )
    }
  }

  return { value: schema }
}

export const hashMapRecordSchemas = (backend: StorageBackend) => {
  const hash_map = RECORD_SCHEMAS[backend]

  if (!hash_map) {
    return {
      error: new Error(
        `storage backend '${backend}' does not define schemas for its records`
      )
    }
  }

  return { value: hash_map }
}
