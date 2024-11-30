import { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { Result } from './store/result.js'
import type { BaseValueSyndicate } from './store/values.js'

export interface Syndicator<
  V extends BaseValueSyndicate = BaseValueSyndicate,
  E extends Error = Error
> {
  uid: string
  syndicate: (url: string, jf2: Jf2) => Promise<Result<E, V>>
}
