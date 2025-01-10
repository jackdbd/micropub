import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import { createdRecord } from '../storage-implementations/index.js'
import type { BaseProps, StoreRecord } from '../storage-api/index.js'
import { newConformResult } from '../validators.js'
import { init, JSONRecord, parse, write } from './json.js'

interface Config {
  ajv: Ajv
  filepath: string
  record_key: string
  schema_props: Schema
  schema_record: Schema
}

export const defStoreRecord = <Props extends BaseProps = BaseProps>(
  config: Config
) => {
  const { ajv, filepath, record_key, schema_props, schema_record } = config

  const storeRecord: StoreRecord<Props> = async (props) => {
    const validationErrorsSeparator = ';'

    const { error: error_before, value } = newConformResult(
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
        summary: `Props do not conform to schema so the value was not stored in ${filepath}`,
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

    const { error: parse_error, value: parsed } = await parse(filepath)

    if (parse_error) {
      return { error: parse_error }
    }

    // Option A: do not store the record ID in the record itself (e.g. do not
    // store `jti` in a record about an access token, `client_id` in a record
    // about a client application, etc.)
    // const { [record_key]: record_id, ...rest } = value.validated
    // const record = newRecord(rest)

    // Option B: store the record ID in the record itself
    const record_id = value.validated[record_key] as string
    const record = createdRecord(value.validated) as JSONRecord

    parsed[record_id] = record

    const { error: error_after, value: value_after } = newConformResult(
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
        summary: `Record does not conform to schema so it was not stored in ${filepath}`,
        details: error_after.message.split(validationErrorsSeparator),
        suggestions: [`ensure the schema you specified is correct`]
      })
      return { error: new Error(message) }
    }

    const { error: write_error } = await write(filepath, parsed)

    if (write_error) {
      return { error: write_error }
    }

    return { value: value_after.validated }
  }

  return storeRecord
}
