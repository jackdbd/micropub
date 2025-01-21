import type { Atom } from '@thi.ng/atom'
import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import type {
  BaseProps,
  BaseRecord,
  StoreRecord
} from '../storage-api/index.js'
import { createdRecord } from '../storage-implementations/index.js'
import { conformResult } from '@jackdbd/schema-validators'

interface Config<R extends BaseRecord = BaseRecord> {
  ajv: Ajv
  atom: Atom<R>
  record_key: string
  schema_props: Schema
  schema_record: Schema
}

export const defStoreRecord = <Props extends BaseProps = BaseProps>(
  config: Config
) => {
  const { ajv, atom, record_key, schema_props, schema_record } = config

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
        summary: `Props do not conform to schema so the value was not stored in atom`,
        details: error_before.message.split(validationErrorsSeparator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the data has all the required properties`
        ]
      })
      return { error: new Error(message) }
    }

    const record_id = value.validated[record_key] as string
    const record = createdRecord(value.validated)

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
        summary: `Record does not conform to schema so it was not stored in atom`,
        details: error_after.message.split(validationErrorsSeparator),
        suggestions: [`ensure the schema you specified is correct`]
      })
      return { error: new Error(message) }
    }

    atom.swap((state) => {
      return { ...state, [record_id]: record }
    })

    return { value: value_after.validated }
  }

  return storeRecord
}
