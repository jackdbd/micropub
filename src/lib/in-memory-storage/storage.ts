import type { Atom } from '@thi.ng/atom'
import {
  type CodeTable,
  type GetRecord,
  type SetRecord
} from '../authorization-code-storage-interface/index.js'

interface Config {
  atom: Atom<CodeTable>
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
