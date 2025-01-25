import type {
  AuthorizationCodeProps,
  AuthorizationCodeImmutableRecord,
  AuthorizationCodeMutableRecord
} from '@jackdbd/fastify-authorization-endpoint'
import type { StorageApi } from '../lib/storage-api/index.js'

export interface Config {
  storage: StorageApi
}

export const defOnAuthorizationCodeVerified = (config: Config) => {
  const { storage } = config

  const onAuthorizationCodeVerified = async (code: string) => {
    const { error } = await storage.updateMany({
      where: [{ key: 'code', op: '==', value: code }],
      set: { used: true }
    })

    if (error) {
      throw error
    }
  }

  return onAuthorizationCodeVerified
}

export const defOnUserApprovedRequest = (config: Config) => {
  const { storage } = config

  const onUserApprovedRequest = async (props: AuthorizationCodeProps) => {
    // TODO: fix the type of code_challend and code_challenge_method in @jackdbd/fastify-authorization-endpoint
    const { error } = await storage.storeOne(props as any)

    if (error) {
      throw error
    }
  }

  return onUserApprovedRequest
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { storage } = config

  const retrieveAuthorizationCode = async (code: string) => {
    const { error, value } = await storage.retrieveOne({
      where: [{ key: 'code', op: '==', value: code }]
    })

    if (error) {
      throw error
    }

    return value as
      | AuthorizationCodeImmutableRecord
      | AuthorizationCodeMutableRecord
  }

  return retrieveAuthorizationCode
}
