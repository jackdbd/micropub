import type { Ajv, Schema } from 'ajv'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { errorMessage } from '../rich-error-message/index.js'
import type { RetrieveRecords } from '../storage-api/index.js'
import { conformResult } from '@jackdbd/schema-validators'
import { init, parse, type JSONRecord } from './json.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema: Schema
}

export const defRetrieveRecords = <R extends JSONRecord = JSONRecord>(
  config: Config
) => {
  const { ajv, filepath, schema } = config

  const retrieveRecords: RetrieveRecords = async (query) => {
    const { error: init_error } = await init(filepath)

    if (init_error) {
      return { error: init_error }
    }

    const { error: parse_error, value: parsed } = await parse(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    let records = Object.values(parsed) as R[]

    if (query && query.where) {
      const condition = query.condition || 'AND'
      const predicates = query.where.map((test) => defPredicate(test))

      let predicate: Predicate<R>
      // let predicate: Predicate<JSONRecord>
      if (condition === 'OR') {
        predicate = composeOr(predicates)
      } else {
        predicate = composeAnd(predicates)
      }

      records = records.filter(predicate)
    }

    const validationErrorsSeparator = ';'
    // ;(records as any)[0].foo = 123 // uncomment to see validation errors
    const { error, value } = conformResult(
      { ajv, schema, data: records },
      { validationErrorsSeparator }
    )

    if (error) {
      const message = errorMessage({
        summary: `Value retrieved from filepath ${filepath} does not conform to schema`,
        details: error.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the data in ${filepath} is correct`
        ]
      })

      return { error: new Error(message) }
    } else {
      records = value.validated
    }

    return { value: records }
  }

  return retrieveRecords
}
