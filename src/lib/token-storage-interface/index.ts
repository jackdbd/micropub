import type { RetrieveAccessToken } from './retrieve-access-token.js'
import type { StoreAccessToken } from './store-access-token.js'
import type { RetrieveRefreshToken } from './retrieve-refresh-token.js'
import type { StoreRefreshToken } from './store-refresh-token.js'

export {
  defRetrieveAccessToken,
  retrieveAccessToken,
  type RetrieveAccessToken
} from './retrieve-access-token.js'

export {
  defRetrieveRefreshToken,
  retrieveRefreshToken,
  type RetrieveRefreshToken
} from './retrieve-refresh-token.js'

export {
  access_token_record,
  type AccessTokenRecord,
  access_token_table,
  type AccessTokenTable,
  refresh_token_record,
  type RefreshTokenRecord,
  refresh_token_table,
  type RefreshTokenTable,
  type RetrieveAccessTokenRecord,
  type RetrieveRefreshTokenRecord,
  type StoreAccessTokenRecord,
  type StoreRefreshTokenRecord
} from './schemas.js'

export {
  defStoreAccessToken,
  store_access_token_param,
  storeAccessToken,
  type StoreAccessToken
} from './store-access-token.js'

export {
  defStoreRefreshToken,
  store_refresh_token_param,
  storeRefreshToken,
  type StoreRefreshToken
} from './store-refresh-token.js'

export interface TokenStorage {
  retrieveAccessToken: RetrieveAccessToken
  retrieveRefreshToken: RetrieveRefreshToken
  storeAccessToken: StoreAccessToken
  storeRefreshToken: StoreRefreshToken
}
