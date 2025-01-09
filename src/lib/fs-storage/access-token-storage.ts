import type { RetrieveRecord, RetrieveRecords, StoreRecord } from '../crud.js'
import type {
  AccessTokenTable,
  AccessTokenRecord,
  JTI,
  StoreAccessTokenParam
} from '../token-storage-interface/index.js'
import { filterJSON, readJSON, writeJSON } from './json.js'
import { ACCESS_TOKEN_RECORD_KEYS } from '../../constants.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord<AccessTokenRecord, JTI> = async (
    jti
  ) => {
    const { error, value: table } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[jti] }
  }

  const retrieveRecords: RetrieveRecords<AccessTokenRecord> = async (
    criteria
  ) => {
    const { error, value: records } = await filterJSON<AccessTokenRecord>(
      filepath,
      ACCESS_TOKEN_RECORD_KEYS,
      criteria
    )

    if (error) {
      return { error }
    }

    return { value: records }
  }

  const storeRecord: StoreRecord<StoreAccessTokenParam> = async (datum) => {
    const { error, value: table } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    const { jti, ...rest } = datum
    table[jti] = rest

    const { error: write_error, value } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value }
  }

  return {
    retrieveRecord,
    retrieveRecords,
    storeRecord
  }
}
