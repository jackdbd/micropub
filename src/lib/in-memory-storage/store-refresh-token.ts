import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defStoreRefreshToken as defImplementation,
  type RefreshTokenTable
} from '../token-storage-interface/index.js'
import { defStorage } from './refresh-token-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<RefreshTokenTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreRefreshToken = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const { retrieveRecord, storeRecord } = defStorage({ atom })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    retrieveRecord,
    storeRecord
  })
}
