import type { Atom } from '@thi.ng/atom'
import type { BaseRecord, RemoveRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  Predicate
} from '../storage-implementations/predicate.js'

interface Config<R extends BaseRecord = BaseRecord> {
  atom: Atom<R>
  record_key: string
}

export const defRemoveRecords = <R extends BaseRecord = BaseRecord>(
  config: Config
) => {
  const { atom, record_key } = config

  const removeRecords: RemoveRecords = async (query) => {
    if (!query) {
      atom.reset({})
      return { value: [] as R[] }
    }

    const records = Object.values(atom.deref()) as R[]

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
    }, {})

    atom.reset(data)

    return { value: removed }
  }

  return removeRecords
}
