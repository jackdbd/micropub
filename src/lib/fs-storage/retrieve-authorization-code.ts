import type Ajv from 'ajv'
import { defRetrieveAuthorizationCode as defImplementation } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { ajv, filepath, prefix, report_all_ajv_errors } = config

  const { getRecord } = defStorage({ filepath })

  return defImplementation({
    ajv,
    getRecord,
    prefix,
    report_all_ajv_errors
  })
}
