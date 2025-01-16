import type { Ajv, Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import { errorMessage } from '../rich-error-message/index.js'
import type { UpdateRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { conformResult } from '../validators.js'
import { appendMany, parse, type JSONLRecord } from './jsonl.js'
import { newRecord } from './record.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema: Schema
}

/**
 * Creates **immutable** records that represent an update of all the records
 * that match the given `query`.
 */
export const defUpdateRecords = <R extends JSONLRecord = JSONLRecord>(
  config: Config
) => {
  const { ajv, filepath, schema } = config

  const updateRecords: UpdateRecords = async (query) => {
    const { error: parse_error, value: parsed } = await parse<R>(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    const condition = query.condition || 'AND'
    const predicates = query.where.map((test) => defPredicate(test))

    let predicate: Predicate<R>
    if (condition === 'OR') {
      predicate = composeOr(predicates)
    } else {
      predicate = composeAnd(predicates)
    }

    const records_selected = parsed.filter(predicate)

    // logs.push(
    //   `query affects ${records_selected.length} records: ${stringify(query)}`
    // )

    const records = records_selected.map((rec) => {
      let record = newRecord(rec) as R

      for (const [key, to] of Object.entries(query.set)) {
        if (predicate(record)) {
          ;(record as JSONLRecord)[key] = to
        }
      }

      return record
    })

    const validationErrorsSeparator = ';'
    // ;(records as any)[0].foo = 123 // uncomment to see validation errors
    const { error, value } = conformResult(
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
        summary: `Records about to be appended in ${filepath} do not conform to schema (i.e. the values after the update query, before writing them to ${filepath})`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the query is correct: ${str}`,
          `ensure the data in ${filepath} is correct`
        ]
      })

      return { error: new Error(message) }
    }

    const { error: append_error, value: appended } = await appendMany(
      filepath,
      value.validated
    )

    if (append_error) {
      return { error: append_error }
    }

    // validate the records returned by appendMany?

    return { value: appended }
  }

  return updateRecords
}
