import type { Atom } from '@thi.ng/atom'
import type { RetrieveRecord, StoreRecord } from '../crud.js'
import type {
  AccessTokenTable,
  AccessTokenRecord,
  JTI,
  StoreAccessTokenParam
} from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRecord<AccessTokenRecord, JTI> = async (
    jti
  ) => {
    const record = atom.deref()[jti]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreRecord<StoreAccessTokenParam> = async (datum) => {
    const { jti, ...rest } = datum

    atom.swap((state) => {
      return { ...state, [jti]: rest }
    })

    return { value: { message: `atom swapped` } }
  }

  return { retrieveRecord, storeRecord }
}
