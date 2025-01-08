import type { Atom } from '@thi.ng/atom'
import type {
  CodeTable,
  RetrieveAuthorizationCodeRecord,
  StoreAuthorizationCodeRecord
} from '../authorization-code-storage-interface/index.js'

interface Config {
  atom: Atom<CodeTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveAuthorizationCodeRecord = async (code) => {
    const record = atom.deref()[code]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreAuthorizationCodeRecord = async (datum) => {
    const { code, ...rest } = datum

    atom.swap((state) => {
      return { ...state, [code]: rest }
    })
    return { value: { message: `atom swapped` } }
  }

  return { retrieveRecord, storeRecord }
}
