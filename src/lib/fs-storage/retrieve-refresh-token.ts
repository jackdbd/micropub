import type Ajv from 'ajv'
import { defRetrieveRefreshToken as defImplementation } from '../token-storage-interface/index.js'
import { defStorage } from './refresh-token-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors: boolean
}

export const defRetrieveRefreshToken = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
