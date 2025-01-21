import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import type { BaseProps, StoreRecord } from '../storage-api/index.js'
import { conformResult } from '@jackdbd/schema-validators'
import { appendMany, init } from './jsonl.js'
import { newRecord } from './record.js'

interface Config {
  ajv: Ajv
  filepath: string
  schema_props: Schema
  schema_record: Schema
}

export const defStoreRecord = <Props extends BaseProps = BaseProps>(
  config: Config
) => {
  const { ajv, filepath, schema_props, schema_record } = config

  const storeRecord: StoreRecord<Props> = async (props) => {
    const validationErrorsSeparator = ';'

    const { error: error_before, value } = conformResult(
      {
        ajv,
        schema: schema_props,
        // uncomment to see validation errors
        // data: { ...props, foo: 123 }
        data: props
      },
      { validationErrorsSeparator }
    )

    if (error_before) {
      const message = errorMessage({
        summary: `Value does not conform to schema so it was not appended in ${filepath}`,
        details: error_before.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the data has all the required properties`
        ]
      })
      return { error: new Error(message) }
    }

    const { error: init_error } = await init(filepath)

    if (init_error) {
      return { error: init_error }
    }

    const { error, value: records } = await appendMany(filepath, [
      newRecord(value.validated)
    ])

    if (error) {
      return { error }
    }

    if (records.length !== 1) {
      const message = errorMessage({
        summary: `Appended ${records.length} records in ${filepath} (instead of just 1)`
        // details: [],
        // suggestions: []
      })
      return { error: new Error(message) }
    }

    const record = records[0]

    const { error: error_after, value: value_after } = conformResult(
      {
        ajv,
        schema: schema_record,
        // uncomment to see validation errors
        // data: { ...record, foo: 123 }
        data: record
      },
      { validationErrorsSeparator }
    )

    if (error_after) {
      const message = errorMessage({
        summary: `Record appended in ${filepath} does not conform to the specified schema`,
        details: error_after.message.split(validationErrorsSeparator),
        suggestions: [`ensure the schema you specified is correct`]
      })
      return { error: new Error(message) }
    }

    return { value: value_after.validated }
  }

  return storeRecord
}
