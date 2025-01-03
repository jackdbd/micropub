import type Ajv from 'ajv'
import { defRetrieveAuthorizationCode as defImplementation } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { ajv, filepath, log, prefix, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ filepath })

  return defImplementation({
    ajv,
    log,
    prefix,
    report_all_ajv_errors,
    retrieveRecord
  })
}
