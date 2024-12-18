import type {
  AddToIssuedCodes,
  IssueTable
} from '../authorization-code-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defAddToIssuedCodes = (config: Config) => {
  const { filepath } = config

  const addToIssuedCodes: AddToIssuedCodes = async (payload) => {
    const { error: read_error, value: table } = await readJSON<IssueTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    const { exp, code } = payload

    const record = table[code]

    if (record) {
      return {
        value: { message: `authorization code ${code} has already been added` }
      }
    }

    table[code] = { exp }

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `authorization code ${code} added` } }
  }

  return addToIssuedCodes
}
