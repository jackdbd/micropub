import type { IsAccessTokenBlacklisted } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'
import { readJSON } from './json.js'

interface Config {
  filepath: string
}

export const defIsAccessTokenBlacklisted = (config: Config) => {
  const { filepath } = config

  const isAccessTokenBlacklisted: IsAccessTokenBlacklisted = async (jti) => {
    const { error, value } = await readJSON<AccessTokenTable>(filepath)

    if (error) {
      return { error }
    }

    const record = value[jti]

    if (!record) {
      return { value: false }
    }

    return { value: record.revoked ? true : false }
  }

  return isAccessTokenBlacklisted
}
