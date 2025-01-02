import {
  type CodeTable,
  type GetRecord,
  type SetRecord
} from '../authorization-code-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const getRecord: GetRecord = async (code) => {
    const { error, value: table } = await readJSON<CodeTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[code] }
  }

  const setRecord: SetRecord = async (code, record) => {
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

  return { getRecord, setRecord }
}
