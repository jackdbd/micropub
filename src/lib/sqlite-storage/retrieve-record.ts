import type { Client } from '@libsql/client'
import { errorMessage } from '../rich-error-message/index.js'
import type { RetrieveRecord } from '../storage-api/index.js'
import { selectQuery } from './queries.js'
import type { SQLiteRecord } from './type-mapping.js'

export interface Config {
  client: Client
  table: string
}

export const defRetrieveRecord = <Selected extends SQLiteRecord = SQLiteRecord>(
  config: Config
) => {
  const { client, table } = config

  const retrieveRecord: RetrieveRecord<Selected> = async (query) => {
    const sql = selectQuery(table, query)

    let records: SQLiteRecord[]
    try {
      const rs = await client.execute(sql)
      records = rs.rows
    } catch (ex: any) {
      const message = errorMessage({
        summary: `Cannot retrieve records from table \`${table}\``,
        details: [ex.message],
        suggestions: [
          `ensure the query is correct: ${sql}`,
          `ensure the database credentials are correct`
        ]
      })
      return { error: new Error(message) }
    }

    if (records.length === 1) {
      const value = records[0] as Selected
      return { value }
    } else {
      const message = errorMessage({
        summary: `Retrieved ${records.length} records from table \`${table}\` (instead of 1)`,
        suggestions: [`ensure the query is correct: ${sql}`]
      })
      return { error: new Error(message) }
    }
  }

  return retrieveRecord
}
