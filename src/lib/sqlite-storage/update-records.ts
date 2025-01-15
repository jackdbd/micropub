import type { Client } from '@libsql/client'
import type { UpdateQuery } from '../storage-api/index.js'
import { errorMessage } from '../rich-error-message/index.js'
import type { UpdateRecords } from '../storage-api/index.js'
import { updateQuery } from './queries.js'
import type { SQLiteRecord } from './type-mapping.js'

export interface Config {
  client: Client
  table: string
}

export const defUpdateRecords = (config: Config) => {
  const { client, table } = config

  const updateRecords: UpdateRecords = async (query: UpdateQuery) => {
    const sql = updateQuery(table, query)

    try {
      const rs = await client.execute(sql)

      const value = rs.rows as SQLiteRecord[]
      // TODO: validate schema of the records here?
      // The returned records could have any shape. I think the only way to
      // validate this data is to do it on a column-by-column basis, by
      // selecting the schema for each of the RETURNING columns.
      return { value }
    } catch (ex: any) {
      const message = errorMessage({
        summary: `Cannot update records in table \`${table}\``,
        details: [ex.message],
        suggestions: [
          `ensure the query is correct: ${sql}`,
          `ensure the database credentials are correct`,
          `ensure the data has all the required properties`
        ]
      })
      return { error: new Error(message) }
    }
  }

  return updateRecords
}
