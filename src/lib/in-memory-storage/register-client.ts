import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defRegisterClient as defImplementation,
  type ClientTable,
  type GetRecord,
  type SetRecord
} from '../clients-storage-interface/index.js'

interface Config {
  ajv?: Ajv
  atom: Atom<ClientTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRegisterClient = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const getRecord: GetRecord = async (client_id) => {
    return { error: undefined, value: atom.deref()[client_id] }
  }

  const setRecord: SetRecord = async (client_id, record) => {
    atom.swap((state) => {
      return { ...state, [client_id]: record }
    })
    return { error: undefined }
  }

  return defImplementation({
    ajv,
    getRecord,
    prefix,
    report_all_ajv_errors,
    setRecord
  })
}
