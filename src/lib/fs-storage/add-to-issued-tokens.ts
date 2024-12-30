import type { AddToIssuedTokens } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defAddToIssuedTokens = (config: Config) => {
  const { filepath } = config

  const addToIssuedTokens: AddToIssuedTokens = async (claims) => {
    const { error: read_error, value: table } =
      await readJSON<AccessTokenTable>(filepath)

    if (read_error) {
      return { error: read_error }
    }

    const { exp, iat, jti } = claims

    const found = table[jti]

    if (found) {
      return { value: { message: `token ${jti} has already been added` } }
    }

    table[jti] = { exp, iat }

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `token ${jti} added` } }
  }

  return addToIssuedTokens
}
