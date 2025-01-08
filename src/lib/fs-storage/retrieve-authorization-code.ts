import type Ajv from 'ajv'
import { defRetrieveAuthorizationCode as defImplementation } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
