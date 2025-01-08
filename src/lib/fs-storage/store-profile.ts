import type Ajv from 'ajv'
import {
  defStoreProfile as defImplementation,
  type StoreProfile
} from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors: boolean
}

export const defStoreProfile = (config: Config): StoreProfile => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ filepath })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
