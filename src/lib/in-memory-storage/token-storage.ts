import type { Atom } from '@thi.ng/atom'
import {
  type AccessTokenTable,
  type GetRecord,
  type SetRecord
} from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const getRecord: GetRecord = async (code) => {
    const record = atom.deref()[code]
    return { error: undefined, value: record }
  }

  const setRecord: SetRecord = async (code, record) => {
    atom.swap((state) => {
      return { ...state, [code]: record }
    })
    return { error: undefined }
  }

  return { getRecord, setRecord }
}
