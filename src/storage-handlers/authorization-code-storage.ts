import type {
  AuthorizationCodeImmutableRecord,
  AuthorizationCodeMutableRecord,
  OnUserApprovedRequest
} from '@jackdbd/indieauth/schemas/index'
import { unwrapP } from '@jackdbd/unwrap'
import type { StorageApi } from '../lib/storage-api/index.js'

export interface Config {
  storage: StorageApi
}

export const defOnAuthorizationCodeVerified = (config: Config) => {
  const { storage } = config

  const onAuthorizationCodeVerified = async (code: string) => {
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

  const onUserApprovedRequest: OnUserApprovedRequest = async (props) => {
    // code_challenge and code_challenge_method are of type unknown because they
    // are defined as Refs in the schema.
    const props_ = {
      ...props,
      code_challenge: props.code_challenge as string,
      code_challenge_method: props.code_challenge_method as string
    }
    await unwrapP(storage.storeOne(props_))
  }

  return onUserApprovedRequest
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { storage } = config

  const retrieveAuthorizationCode = async (code: string) => {
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
