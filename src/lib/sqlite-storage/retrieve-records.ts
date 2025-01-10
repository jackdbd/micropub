import type { Client } from '@libsql/client'
import { errorMessage } from '../rich-error-message/index.js'
import type { RetrieveRecords } from '../storage-api/index.js'
import { selectQuery, type SQLiteRecord } from './sqlite.js'

export interface Config {
  client: Client
  table: string
}

export const defRetrieveRecords = <
  Selected extends SQLiteRecord = SQLiteRecord
>(
  config: Config
) => {
  const { client, table } = config

  const retrieveRecords: RetrieveRecords<Selected> = async (query) => {
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

    return { value: records as Selected[] }
  }

  return retrieveRecords
}
