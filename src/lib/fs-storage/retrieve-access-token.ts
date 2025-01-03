import type Ajv from 'ajv'
import { defRetrieveAccessToken as defImplementation } from '../token-storage-interface/index.js'
import { defStorage } from './access-token-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAccessToken = (config: Config) => {
  const { ajv, filepath, prefix, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ filepath })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    retrieveRecord
  })
}
