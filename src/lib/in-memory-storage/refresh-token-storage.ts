import type { Atom } from '@thi.ng/atom'
import type { RetrieveRecord, StoreRecord } from '../crud.js'
import type {
  RefreshTokenTable,
  RefreshToken,
  RefreshTokenRecord,
  StoreRefreshTokenParam
} from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<RefreshTokenTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRecord<
    RefreshTokenRecord,
    RefreshToken
  > = async (refresh_token) => {
    const record = atom.deref()[refresh_token]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreRecord<StoreRefreshTokenParam> = async (datum) => {
    const { refresh_token, ...rest } = datum

    atom.swap((state) => {
      return { ...state, [refresh_token]: rest }
    })

    return { value: { message: `atom swapped` } }
  }

  return { retrieveRecord, storeRecord }
}
