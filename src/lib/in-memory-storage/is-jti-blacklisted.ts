import type { Atom } from '@thi.ng/atom'
import type { IsAccessTokenBlacklisted } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defIsAccessTokenBlacklisted = (config: Config) => {
  const { atom } = config

  const isAccessTokenBlacklisted: IsAccessTokenBlacklisted = async (jti) => {
    const record = atom.deref()[jti]

    if (!record) {
      return { value: false }
    }

    return { value: record.revoked ? true : false }
  }

  return isAccessTokenBlacklisted
}
