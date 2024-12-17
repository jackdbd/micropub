import { defAtom } from '@thi.ng/atom'
import { IssueTable } from '../../lib/token-storage-interface/index.js'

export const init = async () => {
  return defAtom<IssueTable>({})
}
