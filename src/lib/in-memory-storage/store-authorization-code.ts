import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defStoreAuthorizationCode as defImplementation,
  type CodeTable
} from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<CodeTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ atom })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    storeRecord
  })
}
