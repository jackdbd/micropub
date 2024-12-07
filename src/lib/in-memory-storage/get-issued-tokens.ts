import type { Atom } from '@thi.ng/atom'
import type { GetIssuedTokens } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<IssueTable>
}

export const defGetIssuedTokens = (config: Config) => {
  const { atom } = config

  const getIssuedTokens: GetIssuedTokens = async () => {
    const table = atom.deref()
    return { value: { jtis: Object.keys(table) } }
  }

  return getIssuedTokens
}
