import type { Atom } from '@thi.ng/atom'
import {
  type AccessTokenTable,
  type RetrieveAccessTokenRecord,
  type StoreAccessTokenRecord
} from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveAccessTokenRecord = async (jti) => {
    const record = atom.deref()[jti]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreAccessTokenRecord = async (jti, record) => {
    atom.swap((state) => {
      return { ...state, [jti]: record }
    })
    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
