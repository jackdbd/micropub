import {
  type RefreshTokenTable,
  type RetrieveRefreshTokenRecord,
  type StoreRefreshTokenRecord
} from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRefreshTokenRecord = async (jti) => {
    const { error, value: table } = await readJSON<RefreshTokenTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[jti] }
  }

  const storeRecord: StoreRefreshTokenRecord = async (
    refresh_token,
    record
  ) => {
    const { error, value: table } = await readJSON<RefreshTokenTable>(filepath)

    if (error) {
      return { error }
    }

    table[refresh_token] = record

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
