import type { Atom } from '@thi.ng/atom'
import {
  type RefreshTokenTable,
  type RetrieveRefreshTokenRecord,
  type StoreRefreshTokenRecord
} from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<RefreshTokenTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRefreshTokenRecord = async (refresh_token) => {
    const record = atom.deref()[refresh_token]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreRefreshTokenRecord = async (
    refresh_token,
    record
  ) => {
    atom.swap((state) => {
      return { ...state, [refresh_token]: record }
    })
    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
