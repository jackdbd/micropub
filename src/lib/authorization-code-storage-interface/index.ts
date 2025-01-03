import type { RetrieveAuthorizationCode } from './retrieve-authorization-code.js'
import type { StoreAuthorizationCode } from './store-authorization-code.js'

export {
  defRetrieveAuthorizationCode,
  retrieveAuthorizationCode,
  type RetrieveAuthorizationCode
} from './retrieve-authorization-code.js'

export {
  code_record,
  type CodeRecord,
  code_table,
  type CodeTable,
  type RetrieveRecord,
  type StoreRecord
} from './schemas.js'

export {
  defStoreAuthorizationCode,
  storeAuthorizationCode,
  type StoreAuthorizationCode
} from './store-authorization-code.js'

export interface AuthorizationCodeStorage {
  retrieveAuthorizationCode: RetrieveAuthorizationCode
  storeAuthorizationCode: StoreAuthorizationCode
}
