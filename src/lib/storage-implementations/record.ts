import { unixTimestampInMs } from '@jackdbd/indieauth'
import { nanoid } from 'nanoid'
import type { BaseProps } from '../storage-api/index.js'

export const createdRecord = <Props extends BaseProps = BaseProps>(
  props: Props
) => {
  return { ...props, created_at: unixTimestampInMs(), id: nanoid() }
}

// for the "soft delete" pattern
export const deletedRecord = <Props extends BaseProps = BaseProps>(
  props: Props
) => {
  return { ...props, deleted_at: unixTimestampInMs() }
}

// for the "soft delete" pattern
export const undeletedRecord = <Props extends BaseProps = BaseProps>(
  props: Props
) => {
  return { ...props, undeleted_at: unixTimestampInMs() }
}

export const updatedRecord = <Props extends BaseProps = BaseProps>(
  props: Props
) => {
  return { ...props, updated_at: unixTimestampInMs() }
}
