import type {
  Code,
  CodeRecord,
  CodeTable,
  StoreAuthorizationCodeParam
} from '../authorization-code-storage-interface/index.js'
import type { RetrieveRecord, StoreRecord } from '../crud.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord<CodeRecord, Code> = async (code) => {
    const { error, value: table } = await readJSON<CodeTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[code] }
  }

  const storeRecord: StoreRecord<StoreAuthorizationCodeParam> = async (
    datum
  ) => {
    const { error, value: table } = await readJSON<CodeTable>(filepath)

    if (error) {
      return { error }
    }

    const { code, ...rest } = datum

    table[code] = rest

    const { error: write_error, value } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value }
  }

  return { retrieveRecord, storeRecord }
}
