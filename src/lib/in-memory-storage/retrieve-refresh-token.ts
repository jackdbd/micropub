import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defRetrieveRefreshToken as defImplementation,
  type RefreshTokenTable
} from '../token-storage-interface/index.js'
import { defStorage } from './refresh-token-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<RefreshTokenTable>
  report_all_ajv_errors: boolean
}

export const defRetrieveRefreshToken = (config: Config) => {
  const { ajv, atom, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ atom })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
