import type { Atom } from '@thi.ng/atom'
import type { IsBlacklisted } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<IssueTable>
}

export const defIsBlacklisted = (config: Config) => {
  const { atom } = config

  const isBlacklisted: IsBlacklisted = async (jti) => {
    const record = atom.deref()[jti]

    if (!record) {
      return { value: false }
    }

    return { value: record.revoked ? true : false }
  }

  return isBlacklisted
}
