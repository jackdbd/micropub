import type { MarkTokenAsRevoked } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defMarkTokenAsRevoked = (config: Config) => {
  const { filepath } = config

  const markTokenAsRevoked: MarkTokenAsRevoked = async (jti, options) => {
    const opt = options ?? {}
    const { error: read_error, value: table } =
      await readJSON<AccessTokenTable>(filepath)

    if (read_error) {
      return { error: read_error }
    }

    const record = table[jti]

    // The specs say:
    // The authorization server responds with HTTP status code 200 if the token
    // has been revoked successfully or if the client submitted an invalid token.
    // https://datatracker.ietf.org/doc/html/rfc7009#section-2.2
    // I guess a non-existent token counts as invalid.
    if (!record) {
      return {
        value: {
          message: `among issued tokens there isn't one that has jti ${jti}`
        }
      }
    }

    table[jti].revoked = true
    if (opt.revocation_reason) {
      table[jti].revocation_reason = opt.revocation_reason
    }

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `Token ${jti} revoked` } }
  }

  return markTokenAsRevoked
}
