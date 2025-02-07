import type { UserProfileMutableRecord } from '@jackdbd/indieauth/schemas/index'
import type { RetrieveUserProfile } from '@jackdbd/indieauth/schemas/user-provided-functions'
import { unwrapP } from '@jackdbd/unwrap'
import type { StorageApi } from '../lib/storage-api/index.js'
import { default_log, type Log } from './logger.js'

export interface RetrieveConfig {
  log?: Log
  storage: StorageApi
}

export const defRetrieveUserProfile = (config: RetrieveConfig) => {
  const { storage } = config
  const log = config.log ?? default_log

  const retrieveUserProfile: RetrieveUserProfile = async (me) => {
    log.debug(`retrieve user profile ${me} from storage`)
    const record = await unwrapP(
      storage.retrieveOne({ where: [{ key: 'me', op: '==', value: me }] })
    )
    return record as UserProfileMutableRecord
  }

  return retrieveUserProfile
}
