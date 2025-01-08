import type Ajv from 'ajv'
import { defStoreRefreshToken as defImplementation } from '../token-storage-interface/index.js'
import { defStorage } from './refresh-token-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors: boolean
}

export const defStoreRefreshToken = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
