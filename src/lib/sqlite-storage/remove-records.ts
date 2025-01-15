import type { Client } from '@libsql/client'
import { errorMessage } from '../rich-error-message/index.js'
import type { RemoveRecords } from '../storage-api/index.js'
import { deleteQuery } from './queries.js'
import type { SQLiteRecord } from './type-mapping.js'

export interface Config {
  client: Client
  table: string
}

export const defRemoveRecords = (config: Config) => {
  const { client, table } = config

  const removeRecords: RemoveRecords = async (query) => {
    const sql = deleteQuery(table, query)

    try {
      const rs = await client.execute(sql)

      const value = rs.rows as SQLiteRecord[]

      return { value }
    } catch (ex: any) {
      const message = errorMessage({
        summary: `Cannot delete records from table \`${table}\``,
        details: [ex.message],
        suggestions: [
          `ensure the query is correct: ${sql}`,
          `ensure the database credentials are correct`
        ]
      })
      return { error: new Error(message) }
    }
  }

  return removeRecords
}
