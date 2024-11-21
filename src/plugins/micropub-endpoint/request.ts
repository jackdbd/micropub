import type { Jf2PostType, Mf2PostType } from '../../lib/microformats2/index.js'
import type { ActionType } from './actions.js'

export interface PostRequestBody {
  access_token?: string
  action?: ActionType
  h?: Jf2PostType
  type?: Jf2PostType | Mf2PostType[]
  url?: string
}
