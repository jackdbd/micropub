import type { RetrieveAuthorizationCode } from './retrieve-authorization-code.js'
import type { StoreAuthorizationCode } from './store-authorization-code.js'

export {
  defRetrieveAuthorizationCode,
  retrieveAuthorizationCode,
  type RetrieveAuthorizationCode,
  type RetrieveAuthorizationCodeRecord
} from './retrieve-authorization-code.js'

export {
  code,
  type Code,
  code_record,
  type CodeRecord,
  code_table,
  type CodeTable
} from './schemas.js'

export {
  defStoreAuthorizationCode,
  storeAuthorizationCode,
  type StoreAuthorizationCode,
  type StoreAuthorizationCodeParam,
  type StoreAuthorizationCodeRecord
} from './store-authorization-code.js'

export interface AuthorizationCodeStorage {
  retrieveAuthorizationCode: RetrieveAuthorizationCode
  storeAuthorizationCode: StoreAuthorizationCode
}
