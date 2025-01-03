import { defAtom } from '@thi.ng/atom'
import type { CodeTable } from '../../lib/authorization-code-storage-interface/index.js'
import type {
  AccessTokenTable,
  RefreshTokenTable
} from '../../lib/token-storage-interface/index.js'
import type { ClientTable } from '../../lib/clients-storage-interface/index.js'

export const initAuthorizationCodesStorage = async () => {
  return defAtom<CodeTable>({})
}

export const initClientsStorage = async () => {
  return defAtom<ClientTable>({})
}

export const initAccessTokensStorage = async () => {
  return defAtom<AccessTokenTable>({})
}

export const initRefreshTokensStorage = async () => {
  return defAtom<RefreshTokenTable>({})
}
