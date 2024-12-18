import type {
  IssueTable,
  MarkCodeAsUsed
} from '../authorization-code-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defMarkAuthorizationCodeAsUsed = (config: Config) => {
  const { filepath } = config

  const markAuthorizationCodeAsUsed: MarkCodeAsUsed = async (code) => {
    const { error: read_error, value: table } = await readJSON<IssueTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    const record = table[code]

    if (!record) {
      return {
        value: {
          message: `code not found among all issued authorization codes`
        }
      }
    }

    if (record.used) {
      return { error: new Error(`authorization code has already been used`) }
    }

    table[code].used = true

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return {
      value: {
        message: `authorization code is valid and it is now marked as used`
      }
    }
  }

  return markAuthorizationCodeAsUsed
}
