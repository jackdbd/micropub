import type { RetrieveProfile } from './retrieve-profile.js'
import type { StoreProfile } from './store-profile.js'

export {
  defRetrieveProfile,
  retrieveProfile,
  type RetrieveProfile
} from './retrieve-profile.js'

export type { ProfileTable, ProfileURL } from './schemas.js'

export {
  defStoreProfile,
  storeProfile,
  type StoreProfile,
  type StoreProfileParam
} from './store-profile.js'

export interface ProfileStorage {
  retrieveProfile: RetrieveProfile
  storeProfile: StoreProfile
}
