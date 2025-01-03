import type { Atom } from '@thi.ng/atom'
import {
  type CodeTable,
  type RetrieveRecord,
  type StoreRecord
} from '../authorization-code-storage-interface/index.js'

interface Config {
  atom: Atom<CodeTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRecord = async (code) => {
    const record = atom.deref()[code]
    return { error: undefined, value: record }
  }

  const storeRecord: StoreRecord = async (code, record) => {
    atom.swap((state) => {
      return { ...state, [code]: record }
    })
    return { error: undefined }
  }

  return { retrieveRecord, storeRecord }
}
