import {
  type AccessTokenTable,
  type RetrieveAccessTokenRecord,
  type StoreAccessTokenRecord
} from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveAccessTokenRecord = async (jti) => {
    const { error, value: table } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[jti] }
  }

  const storeRecord: StoreAccessTokenRecord = async (jti, record) => {
    const { error, value: table } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    table[jti] = record

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
