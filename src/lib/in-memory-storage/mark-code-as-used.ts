import type { Atom } from '@thi.ng/atom'
import type {
  IssueTable,
  MarkCodeAsUsed
} from '../authorization-code-storage-interface/index.js'

interface Config {
  atom: Atom<IssueTable>
}

export const defMarkAuthorizationCodeAsUsed = (config: Config) => {
  const { atom } = config

  const markAuthorizationCodeAsUsed: MarkCodeAsUsed = async (code) => {
    const table = atom.deref()

    const record = table[code]

    if (!record) {
      return {
        value: {
          message: `code not found among all issued authorization codes`
        }
      }
    }

    if (record.used) {
      return { error: new Error(`authorization code has already been used`) }
    }

    atom.swap((state) => {
      return {
        ...state,
        [code]: {
          ...record,
          used: true
        }
      }
    })

    return {
      value: {
        message: `authorization code is valid and it is now marked as used`
      }
    }
  }

  return markAuthorizationCodeAsUsed
}
