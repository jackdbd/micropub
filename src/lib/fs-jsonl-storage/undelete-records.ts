import type { Ajv, Schema } from 'ajv'
import type { JSONLRecord } from './jsonl.js'
import type { SelectQuery } from '../storage-api/index.js'
import { defUpdateRecords } from './update-records.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema: Schema
}

/**
 * Creates an **immutable** record that is marked as undeleted.
 *
 * In a `.jsonl` file we store immutable records, so there is no need to store a
 * `undeleted_at` property. Instead, we can trace back to the moment when a
 * piece of information was undeleted by looking at the `created_at` property
 * of the first record where `deleted` is `false`.
 */
export const defUndeleteRecords = <R extends JSONLRecord = JSONLRecord>(
  config: Config
) => {
  const { ajv, filepath, schema } = config
  const updateRecords = defUpdateRecords<R>({ ajv, filepath, schema })

  const undeleteRecords = async (query: SelectQuery) => {
    return updateRecords({ ...query, set: { deleted: false } })
  }

  return undeleteRecords
}
