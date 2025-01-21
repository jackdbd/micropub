import type { Atom } from '@thi.ng/atom'
import type { Ajv, Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import { errorMessage } from '../rich-error-message/index.js'
import type { BaseRecord, RetrieveRecord } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  Predicate
} from '../storage-implementations/predicate.js'
import { conformResult } from '@jackdbd/schema-validators'

interface Config<R extends BaseRecord = BaseRecord> {
  ajv: Ajv
  atom: Atom<R>
  schema: Schema
}

export const defRetrieveRecord = <R extends BaseRecord = BaseRecord>(
  config: Config
) => {
  const { ajv, atom, schema } = config

  const retrieveRecord: RetrieveRecord = async (query) => {
    const records = Object.values(atom.deref()) as R[]

    let filtered = records
    if (query.where) {
      const condition = query.condition || 'AND'
      const predicates = query.where.map((test) => defPredicate(test))

      let predicate: Predicate<R>
      if (condition === 'OR') {
        predicate = composeOr(predicates)
      } else {
        predicate = composeAnd(predicates)
      }

      filtered = records.filter(predicate)
    }

    const str = stringify(query)

    if (filtered.length !== 1) {
      const message = errorMessage({
        summary: `Retrieved ${records.length} records from atom (instead of 1) that match this query: ${str}`,
        suggestions: [`ensure the query is correct: ${str}`]
      })
      return {
        error: new Error(message)
      }
    }

    let record = filtered[0] as R

    const validationErrorsSeparator = ';'
    // ;(record as any).foo = 123 // uncomment to see validation errors
    const { error, value } = conformResult(
      { ajv, schema, data: record },
      { validationErrorsSeparator }
    )

    if (error) {
      const message = errorMessage({
        summary: `Value retrieved from atom does not conform to schema`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [`ensure the schema you specified is correct`]
      })

      return { error: new Error(message) }
    }

    return { value: value.validated }
  }
  return retrieveRecord
}
