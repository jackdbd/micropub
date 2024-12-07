import type { RevokeAllTokens } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defRevokeAllTokens = (config: Config) => {
  const { filepath } = config

  const revokeAllTokens: RevokeAllTokens = async (options) => {
    const opt = options || {}
    const { error: read_error, value: table } = await readJSON<IssueTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    // mutate in place
    for (const record of Object.values(table)) {
      // Avoid revoking a token that has already been revoked. We want to keep
      // the original revocatioon reason, if present.
      if (!record.revoked) {
        record.revoked = true
        record.revocation_reason = opt.revocation_reason
      }
    }

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `All tokens revoked` } }
  }

  return revokeAllTokens
}
