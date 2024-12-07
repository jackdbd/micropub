import type { GetIssuedTokens } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'
import { readJSON } from './json.js'

interface Config {
  filepath: string
}

export const defGetIssuedTokens = (config: Config) => {
  const { filepath } = config

  const getIssuedTokens: GetIssuedTokens = async () => {
    const { error: read_error, value: table } = await readJSON<IssueTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    return { value: { jtis: Object.keys(table) } }
  }

  return getIssuedTokens
}
