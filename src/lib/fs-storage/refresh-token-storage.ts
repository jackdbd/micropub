import type { RetrieveRecord, StoreRecord } from '../crud.js'
import type {
  RefreshToken,
  RefreshTokenRecord,
  RefreshTokenTable,
  StoreRefreshTokenParam
} from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord<
    RefreshTokenRecord,
    RefreshToken
  > = async (refresh_token) => {
    const { error, value: table } = await readJSON<RefreshTokenTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[refresh_token] }
  }

  const storeRecord: StoreRecord<StoreRefreshTokenParam> = async (datum) => {
    const { error, value: table } = await readJSON<RefreshTokenTable>(filepath)

    if (error) {
      return { error }
    }

    const { refresh_token, ...rest } = datum

    table[refresh_token] = rest

    const { error: write_error, value } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value }
  }

  return { retrieveRecord, storeRecord }
}
