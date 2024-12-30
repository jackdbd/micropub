import type Ajv from 'ajv'
import { defMarkAuthorizationCodeAsUsed as defImplementation } from '../authorization-code-storage-interface/index.js'
import { defStorage } from './storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defMarkAuthorizationCodeAsUsed = (config: Config) => {
  const { ajv, filepath, prefix, report_all_ajv_errors } = config

  const { getRecord, setRecord } = defStorage({ filepath })

  return defImplementation({
    ajv,
    getRecord,
    prefix,
    report_all_ajv_errors,
    setRecord
  })
}
