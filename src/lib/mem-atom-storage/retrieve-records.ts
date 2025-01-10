import type { Atom } from '@thi.ng/atom'
import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import type { BaseRecord, RetrieveRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  Predicate
} from '../storage-implementations/predicate.js'
import { newConformResult } from '../validators.js'

interface Config<R extends BaseRecord = BaseRecord> {
  ajv: Ajv
  atom: Atom<R>
  schema: Schema
}

export const defRetrieveRecords = <R extends BaseRecord = BaseRecord>(
  config: Config
) => {
  const { ajv, atom, schema } = config

  const retrieveRecords: RetrieveRecords = async (query) => {
    let records = Object.values(atom.deref()) as R[]

    if (query) {
      const condition = query.condition || 'AND'
      const predicates = query.where.map((test) => defPredicate(test))

      let predicate: Predicate<R>
      if (condition === 'OR') {
        predicate = composeOr(predicates)
      } else {
        predicate = composeAnd(predicates)
      }

      records = records.filter(predicate)
    }

    const validationErrorsSeparator = ';'
    // ;(records as any)[0].foo = 123 // uncomment to see validation errors
    const { error, value } = newConformResult(
      { ajv, schema, data: records },
      { validationErrorsSeparator }
    )

    if (error) {
      const message = errorMessage({
        summary: `Value retrieved from atom does not conform to schema`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [`ensure the schema you specified is correct`]
      })

      return { error: new Error(message) }
    } else {
      records = value.validated
    }

    return { value: records }
  }
  return retrieveRecords
}
