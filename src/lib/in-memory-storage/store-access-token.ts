import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defStoreAccessToken as defImplementation,
  type AccessTokenTable
} from '../token-storage-interface/index.js'
import { defStorage } from './token-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<AccessTokenTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreAccessToken = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const { getRecord, setRecord } = defStorage({ atom })

  return defImplementation({
    ajv,
    getRecord,
    prefix,
    report_all_ajv_errors,
    setRecord
  })
}
