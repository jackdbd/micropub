import {
  type CodeTable,
  type RetrieveRecord,
  type StoreRecord
} from '../authorization-code-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord = async (code) => {
    const { error, value: table } = await readJSON<CodeTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[code] }
  }

  const storeRecord: StoreRecord = async (code, record) => {
    const { error, value: table } = await readJSON<CodeTable>(filepath)

    if (error) {
      return { error }
    }

    table[code] = record

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
