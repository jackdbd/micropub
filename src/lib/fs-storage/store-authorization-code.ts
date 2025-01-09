import type Ajv from 'ajv'
import { defStoreAuthorizationCode as defImplementation } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors?: boolean
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
