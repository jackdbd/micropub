import { unixTimestampInMs } from '@jackdbd/indieauth'
import { nanoid } from 'nanoid'
import type { BaseProps } from '../storage-api/index.js'
import type { JSONLRecord } from './jsonl.js'

export const newRecord = <Props extends BaseProps = BaseProps>(
  props: Props
) => {
  return {
    ...props,
    id: nanoid(),
    created_at: unixTimestampInMs()
  } as JSONLRecord
}
