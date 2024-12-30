import type { Atom } from '@thi.ng/atom'
import type { AddToIssuedTokens } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defAddToIssuedTokens = (config: Config) => {
  const { atom } = config

  const addToIssuedTokens: AddToIssuedTokens = async (claims) => {
    const { exp, iat, jti } = claims

    const record = atom.deref()[jti]

    if (record) {
      return { value: { message: `token ${jti} has already been added` } }
    }

    atom.swap((state) => {
      return { ...state, [jti]: { exp, iat } }
    })

    return { value: { message: `token ${jti} added` } }
  }

  return addToIssuedTokens
}
