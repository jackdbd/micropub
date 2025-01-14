import type { AuthorizationCodeProps } from '../lib/authorization-code-storage-interface/authorization-code.js'
import type {
  StorageApi,
  AuthorizationCodeImmutableRecord,
  AuthorizationCodeMutableRecord
} from '../lib/storage-api/index.js'

export const defHandlers = (storage: StorageApi) => {
  const { storeOne, retrieveOne, updateMany } = storage

  const onAuthorizationCodeVerified = async (code: string) => {
    const { error } = await updateMany({
      where: [{ key: 'code', op: '==', value: code }],
      set: { used: true }
    })

    if (error) {
      throw error
    }
  }

  const onUserApprovedRequest = async (props: AuthorizationCodeProps) => {
    const { error } = await storeOne(props)

    if (error) {
      throw error
    }
  }

  const retrieveAuthorizationCode = async (code: string) => {
    const { error, value } = await retrieveOne({
      where: [{ key: 'code', op: '==', value: code }]
    })

    if (error) {
      throw error
    }

    return value as
      | AuthorizationCodeImmutableRecord
      | AuthorizationCodeMutableRecord
  }

  return {
    onAuthorizationCodeVerified,
    onUserApprovedRequest,
    retrieveAuthorizationCode
  }
}
