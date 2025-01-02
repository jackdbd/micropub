import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import { defMarkAuthorizationCodeAsUsed as defImplementation } from '../authorization-code-storage-interface/index.js'
import type { CodeTable } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<CodeTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defMarkAuthorizationCodeAsUsed = (config: Config) => {
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
