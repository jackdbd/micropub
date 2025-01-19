import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import type { RetrieveRecords } from '../storage-api/index.js'
import {
  composeAnd,
  composeOr,
  defPredicate,
  type Predicate
} from '../storage-implementations/predicate.js'
import { conformResult } from '../validators.js'
import { init, parse, type JSONLRecord } from './jsonl.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema: Schema
}

export const defRetrieveRecords = <R extends JSONLRecord = JSONLRecord>(
  config: Config
) => {
  const { ajv, filepath, schema } = config

  const retrieveRecords: RetrieveRecords = async (query) => {
    // TODO: what to do if filepath does not exist? Alternatives:
    // 1. create it (like I am doing at the moment)
    // 2. immediately return an error
    // 3. let it crash with an exception
    // 4. allow to pass an "onFileDoesNotExistError" handler, maybe with a default handler
    const { error: init_error } = await init(filepath)

    if (init_error) {
      return { error: init_error }
    }

    const { error: parse_error, value: parsed } = await parse<R>(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    let records = parsed

    if (query && query.where) {
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
