import type { Atom } from '@thi.ng/atom'
import type { Ajv, Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import { errorMessage } from '../rich-error-message/index.js'
import type { BaseRecord, UpdateRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  Predicate
} from '../storage-implementations/predicate.js'
import { updatedRecord } from '../storage-implementations/record.js'
import { newConformResult } from '../validators.js'

interface Config<R extends BaseRecord = BaseRecord> {
  ajv: Ajv
  atom: Atom<R>
  record_key: string
  schema: Schema
}

export const defUpdateRecords = <R extends BaseRecord = BaseRecord>(
  config: Config
) => {
  const { ajv, atom, record_key, schema } = config

  const updateRecords: UpdateRecords = async (query) => {
    const records_all = Object.values(atom.deref()) as R[]

    const condition = query.condition || 'AND'
    const predicates = query.where.map((test) => defPredicate(test))

    let predicate: Predicate<R>
    if (condition === 'OR') {
      predicate = composeOr(predicates)
    } else {
      predicate = composeAnd(predicates)
    }

    const records_selected = records_all.filter(predicate)

    const patches: { key: string; from: any; to: any }[] = []
    const records = records_selected.map((rec) => {
      let record = updatedRecord(rec) as R

      for (const [key, to] of Object.entries(query.set)) {
        if (predicate(record)) {
          const from = record[key]
          ;(record as any)[key] = to
          patches.push({ key, from, to })
        }
      }

      return record
    })

    const validationErrorsSeparator = ';'
    // ;(records as any)[0].foo = 123 // uncomment to see validation errors
    const { error, value } = newConformResult(
      {
        ajv,
        schema,
        data: records
      },
      { validationErrorsSeparator }
    )

    if (error) {
      const str = stringify(query)
      const message = errorMessage({
        summary: `Records about to be updated in atom do not conform to schema (i.e. the values after the update query, before writing them to the atom)`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the query is correct: ${str}`
        ]
      })

      return { error: new Error(message) }
    }

    const data = value.validated.reduce((acc, record) => {
      const key = record[record_key] as string
      return { ...acc, [key]: record }
    }, {})

    atom.reset(data)

    // console.log('=== update patches ===', patches)
    return { value: value.validated }
  }

  return updateRecords
}
