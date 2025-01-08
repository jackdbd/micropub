import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defRetrieveAuthorizationCode as defImplementation,
  type CodeTable
} from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<CodeTable>
  report_all_ajv_errors: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { ajv, atom, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ atom })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
