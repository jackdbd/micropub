import type { RemoveRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { parse, reset, write, type JSONLRecord } from './jsonl.js'

interface Config {
  filepath: string
}

export const defRemoveRecords = <R extends JSONLRecord = JSONLRecord>(
  config: Config
) => {
  const { filepath } = config

  const removeRecords: RemoveRecords = async (query) => {
    if (!query) {
      const { error } = await reset(filepath)

      if (error) {
        return { error }
      }

      return { value: [] as R[] }
    }

    const { error: parse_error, value: records } = await parse<R>(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    const condition = query.condition || 'AND'

    const predicates = query.where.map((test) => defPredicate(test))

    let shouldRemove: Predicate<R>
    if (condition === 'OR') {
      shouldRemove = composeOr(predicates)
    } else {
      shouldRemove = composeAnd(predicates)
    }

    const removed = records.filter(shouldRemove)

    // const removed_ids = records_to_remove.map((rec) => rec.id as string | number)

    const preds = removed.map((rec) => {
      return defPredicate({ key: 'id', op: '!=', value: rec.id })
    })

    const shouldKeep = composeAnd(preds)

    const records_to_keep = records.filter(shouldKeep)

    const { error } = await write(filepath, records_to_keep)

    if (error) {
      return { error }
    }

    return { value: removed }
  }

  return removeRecords
}
