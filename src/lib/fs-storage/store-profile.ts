import type Ajv from 'ajv'
import { defStoreProfile as defImplementation } from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreProfile = (config: Config) => {
  const { ajv, filepath, prefix, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ filepath })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    storeRecord
  })
}
