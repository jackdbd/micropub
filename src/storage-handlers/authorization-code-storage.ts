import type {
  AuthorizationCodeImmutableRecord,
  AuthorizationCodeMutableRecord,
  OnUserApprovedRequest
} from '@jackdbd/indieauth/schemas/index'
import { unwrapP } from '@jackdbd/unwrap'
import type { StorageApi } from '../lib/storage-api/index.js'
import { default_log, type Log } from './logger.js'

export interface Config {
  log?: Log
  storage: StorageApi
}

export const defOnAuthorizationCodeVerified = (config: Config) => {
  const { storage } = config
  const log = config.log ?? default_log

  const onAuthorizationCodeVerified = async (code: string) => {
    log.debug(`set authorization code ${code} as used`)
    await unwrapP(
      storage.updateMany({
        where: [{ key: 'code', op: '==', value: code }],
        set: { used: true }
      })
    )
  }

  return onAuthorizationCodeVerified
}

export const defOnUserApprovedRequest = (config: Config) => {
  const { storage } = config
  const log = config.log ?? default_log

  const onUserApprovedRequest: OnUserApprovedRequest = async (props) => {
    // code_challenge and code_challenge_method are of type unknown because they
    // are defined as Refs in the schema.
    const props_ = {
      ...props,
      code_challenge: props.code_challenge as string,
      code_challenge_method: props.code_challenge_method as string
    }

    log.debug(`store authorization code ${props_.code} in storage`)
    await unwrapP(storage.storeOne(props_))
  }

  return onUserApprovedRequest
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { storage } = config
  const log = config.log ?? default_log

  const retrieveAuthorizationCode = async (code: string) => {
    log.debug(`retrieve authorization code ${code} from storage`)
    const record = await unwrapP(
      storage.retrieveOne({
        where: [{ key: 'code', op: '==', value: code }]
      })
    )

    return record as
      | AuthorizationCodeImmutableRecord
      | AuthorizationCodeMutableRecord
  }

  return retrieveAuthorizationCode
}
