import {
  type AccessTokenTable,
  type GetRecord,
  type SetRecord
} from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const getRecord: GetRecord = async (jti) => {
    const { error, value: table } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[jti] }
  }

  const setRecord: SetRecord = async (jti, record) => {
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

  return { getRecord, setRecord }
}
