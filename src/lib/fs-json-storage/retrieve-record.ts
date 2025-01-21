import type { Ajv, Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { errorMessage } from '../rich-error-message/index.js'
import type { RetrieveRecord } from '../storage-api/index.js'
import { conformResult } from '@jackdbd/schema-validators'
import { init, parse, type JSONRecord } from './json.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema: Schema
}

export const defRetrieveRecord = <R extends JSONRecord = JSONRecord>(
  config: Config
) => {
  const { ajv, filepath, schema } = config

  const retrieveRecord: RetrieveRecord = async (query) => {
    const { error: init_error } = await init(filepath)

    if (init_error) {
      return { error: init_error }
    }

    const { error: parse_error, value: parsed } = await parse(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    const records = Object.values(parsed) as R[]

    let filtered = records
    if (query.where) {
      const condition = query.condition || 'AND'
      const predicates = query.where.map((test) => defPredicate(test))

      let predicate: Predicate<R>
      // let predicate: Predicate<JSONRecord>
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
        summary: `Retrieved ${records.length} records from filepath ${filepath} (instead of 1) that match this query: ${str}`,
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

    // TODO: what to do if record does not conform to schema? Alternatives:
    // 1. just return the error
    // 2. delete the record
    // 3. allow to pass an "onSchemaError" handler, maybe with a default handler
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
    }

    return { value: value.validated }
  }

  return retrieveRecord
}
