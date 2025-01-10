import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import type { RemoveRecords } from '../storage-api/index.js'
import { parse, ParsedJSON, reset, write, type JSONRecord } from './json.js'

interface Config {
  filepath: string
  record_key: string
}

export const defRemoveRecords = <R extends JSONRecord = JSONRecord>(
  config: Config
) => {
  const { filepath, record_key } = config

  const removeRecords: RemoveRecords = async (query) => {
    if (!query) {
      const { error } = await reset(filepath)

      if (error) {
        return { error }
      }

      return { value: [] as R[] }
    }

    const { error: parse_error, value: parsed } = await parse(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    const records = Object.values(parsed) as R[]

    const condition = query.condition || 'AND'
    const predicates = query.where.map((test) => defPredicate(test))

    let shouldRemove: Predicate<R>
    if (condition === 'OR') {
      shouldRemove = composeOr(predicates)
    } else {
      shouldRemove = composeAnd(predicates)
    }

    const removed = records.filter(shouldRemove)

    const keep = new Set(records)
    removed.forEach((rec) => {
      keep.delete(rec)
    })

    const data = [...keep].reduce((acc, record) => {
      const key = record[record_key] as string
      return { ...acc, [key]: record }
    }, {} as ParsedJSON)

    const { error } = await write(filepath, data)

    if (error) {
      return { error }
    }

    return { value: removed }
  }
  return removeRecords
}
