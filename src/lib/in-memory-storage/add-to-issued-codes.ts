import type { Atom } from '@thi.ng/atom'
import type {
  AddToIssuedCodes,
  IssueTable
} from '../authorization-code-storage-interface/index.js'

interface Config {
  atom: Atom<IssueTable>
}

export const defAddToIssuedCodes = (config: Config) => {
  const { atom } = config

  const addToIssuedCodes: AddToIssuedCodes = async (payload) => {
    const { code, exp } = payload

    const record = atom.deref()[code]

    if (record) {
      return {
        value: { message: `authorization code ${code} has already been added` }
      }
    }

    atom.swap((state) => {
      return { ...state, [code]: { exp } }
    })

    return { value: { message: `authorization code ${code} added` } }
  }

  return addToIssuedCodes
}
