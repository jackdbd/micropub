import type { IsBlacklisted } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'
import { readJSON } from './json.js'

interface Config {
  filepath: string
}

export const defIsBlacklisted = (config: Config) => {
  const { filepath } = config

  const isBlacklisted: IsBlacklisted = async (jti) => {
    const { error, value } = await readJSON<IssueTable>(filepath)

    if (error) {
      return { error }
    }

    const record = value[jti]

    if (!record) {
      return { value: false }
    }

    return { value: record.revoked ? true : false }
  }

  return isBlacklisted
}
