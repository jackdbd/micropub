import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defRetrieveAccessToken as defImplementation,
  type AccessTokenTable
} from '../token-storage-interface/index.js'
import { defStorage } from './access-token-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<AccessTokenTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAccessToken = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ atom })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    retrieveRecord
  })
}
