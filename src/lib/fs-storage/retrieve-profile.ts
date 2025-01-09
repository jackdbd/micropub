import type Ajv from 'ajv'
import { defRetrieveProfile as defImplementation } from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors?: boolean
}

export const defRetrieveProfile = (config: Config) => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
