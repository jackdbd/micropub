import type Ajv from 'ajv'
import { defStoreAccessToken as defImplementation } from '../token-storage-interface/index.js'
import { defStorage } from './access-token-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors?: boolean
}

export const defStoreAccessToken = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
