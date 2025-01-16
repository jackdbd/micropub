import type { Client } from '@libsql/client'
import type { Ajv, Schema } from 'ajv'
import { errorMessage } from '../rich-error-message/index.js'
import type { StoreRecord } from '../storage-api/index.js'
import { conformResult } from '../validators.js'
import { insertQuery } from './queries.js'
import {
  jsPropsToSQLite,
  sqliteRecordToJS,
  type SQLiteRecord
} from './type-mapping.js'

export interface Config {
  ajv: Ajv
  client: Client
  schema_before: Schema
  schema_after: Schema
  table: string
}

export const defStoreRecord = (config: Config) => {
  const { ajv, client, schema_before, schema_after, table } = config
  const separator = ';'

  const storeRecord: StoreRecord = async (props) => {
    const { error: error_before, value } = conformResult(
      {
        ajv,
        schema: schema_before,
        data: props
      },
      { validationErrorsSeparator: separator }
    )

    if (error_before) {
      const message = errorMessage({
        summary: `Value does not conform to schema so it was not inserted into table \`${table}\``,
        details: error_before.message.split(separator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the data has all the required properties`
        ]
      })
      return { error: new Error(message) }
    }

    const sqliteProps = jsPropsToSQLite(value.validated)

    const { sql, args } = insertQuery(table, sqliteProps)

    let records: SQLiteRecord[]
    try {
      const rs = await client.execute({ sql, args })
      records = rs.rows
    } catch (ex: any) {
      const message = errorMessage({
        summary: `Cannot insert records in table \`${table}\``,
        details: [ex.message],
        suggestions: [
          `ensure the query is correct: ${sql}`,
          `ensure the database credentials are correct`,
          `ensure the database was migrated so it matches the schema you provided`,
          `ensure the data has all the required properties`
        ]
      })

      return { error: new Error(message) }
    }

    if (records.length !== 1) {
      const message = errorMessage({
        summary: `Inserted ${records.length} records in table \`${table}\` (instead of just 1)`,
        suggestions: [`ensure the query is correct: ${sql}`]
      })
      return { error: new Error(message) }
    }

    const record = sqliteRecordToJS(records[0])

    const { error: error_after, value: value_after } = conformResult(
      {
        ajv,
        schema: schema_after,
        data: record
      },
      { validationErrorsSeparator: separator }
    )

    if (error_after) {
      const message = errorMessage({
        summary: `Record inserted into table \`${table}\` does not conform to the specified schema`,
        details: error_after.message.split(separator),
        suggestions: [
          `ensure the schema you specified is correct`,
          `ensure the database is in sync with the schema`
        ]
      })
      return { error: new Error(message) }
    }

    return { value: value_after.validated }
  }

  return storeRecord
}
