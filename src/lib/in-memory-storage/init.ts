import { defAtom } from '@thi.ng/atom'
import { IssueTable as IssueTableCodes } from '../../lib/authorization-code-storage-interface/index.js'
import { IssueTable as IssueTableTokens } from '../../lib/token-storage-interface/index.js'

export const initCodesStorage = async () => {
  return defAtom<IssueTableCodes>({})
}

export const initTokensStorage = async () => {
  return defAtom<IssueTableTokens>({})
}
