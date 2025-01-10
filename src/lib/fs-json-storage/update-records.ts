import type { Ajv, Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { errorMessage } from '../rich-error-message/index.js'
import { updatedRecord } from '../storage-implementations/record.js'
import type { UpdateRecords } from '../storage-api/index.js'
import { newConformResult } from '../validators.js'
import {
  parse,
  write,
  type JSONRecord,
  type JSONValue,
  type ParsedJSON
} from './json.js'

interface Config {
  ajv: Ajv
  filepath: string
  record_key: string
  schema: Schema
}

/**
 * Updates all the records that match the given `query`.
 */
export const defUpdateRecords = <R extends JSONRecord = JSONRecord>(
  config: Config
) => {
  const { ajv, filepath, record_key, schema } = config

  const updateRecords: UpdateRecords = async (query) => {
    const { error: parse_error, value: parsed } = await parse<ParsedJSON>(
      filepath
    )

    if (parse_error) {
      return { error: parse_error }
    }

    const records_all = Object.values(parsed) as R[]

    const condition = query.condition || 'AND'
    const predicates = query.where.map((test) => defPredicate(test))

    let predicate: Predicate<R>
    if (condition === 'OR') {
      predicate = composeOr(predicates)
    } else {
      predicate = composeAnd(predicates)
    }

    const records_selected = records_all.filter(predicate)

    const patches: { key: string; from: JSONValue; to: JSONValue }[] = []
    const records = records_selected.map((rec) => {
      let record = updatedRecord(rec) as R

      for (const [key, to] of Object.entries(query.set)) {
        if (predicate(record)) {
          const from = record[key]
          ;(record as JSONRecord)[key] = to
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
        summary: `Records about to be updated in ${filepath} do not conform to schema (i.e. the values after the update query, before writing them to ${filepath})`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the query is correct: ${str}`,
          `ensure the data in ${filepath} is correct`
        ]
      })

      return { error: new Error(message) }
    }

    const data = value.validated.reduce((acc, record) => {
      const key = record[record_key] as string
      return { ...acc, [key]: record }
    }, {} as ParsedJSON)

    const { error: write_error } = await write(filepath, data)

    if (write_error) {
      return { error: write_error }
    }

    // console.log('=== update patches ===', patches)
    return { value: value.validated }
  }

  return updateRecords
}
