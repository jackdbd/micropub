import type Ajv from 'ajv'
import {
  defRetrieveAuthorizationCode,
  defStoreAuthorizationCode,
  type AuthorizationCodeStorage
} from '../authorization-code-storage-interface/index.js'
import { defStorage } from './code-storage.js'

interface Config {
  ajv?: Ajv
  filepath: string
  report_all_ajv_errors: boolean
}

export const authorizationCodeStorage = (
  config: Config
): AuthorizationCodeStorage => {
  const { ajv, filepath, report_all_ajv_errors } = config

  const { retrieveRecord, storeRecord } = defStorage({ filepath })

  return {
    retrieveAuthorizationCode: defRetrieveAuthorizationCode({
      ajv,
      report_all_ajv_errors,
      retrieveRecord
    }),
    storeAuthorizationCode: defStoreAuthorizationCode({
      ajv,
      report_all_ajv_errors,
      storeRecord
    })
  }
}
