import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  type Code,
  type CodeRecord,
  defStoreAuthorizationCode as defImplementation
} from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<Record<Code, CodeRecord>>
  report_all_ajv_errors?: boolean
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { ajv, atom, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ atom })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
