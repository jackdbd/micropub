import type Ajv from 'ajv'
import { defStoreAccessToken as defImplementation } from '../token-storage-interface/index.js'
import { defStorage } from './token-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreAccessToken = (config: Config) => {
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
