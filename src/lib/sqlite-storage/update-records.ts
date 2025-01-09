import type { Client, Row } from '@libsql/client'
import type { Value, UpdateRecords } from '../crud.js'

export interface Config {
  client: Client
  table_name: string
  returning?: string[]
}

export const defUpdateRecords = (config: Config) => {
  const { client, returning, table_name } = config

  // Remember that WHERE can be composed by multiple expressions.
  // SELECT *
  // FROM suppliers
  // WHERE
  //   (state = 'California' AND supplier_id <> 900) OR
  //   (supplier_id = 100);

  const updateRecords: UpdateRecords<{
    message: string
    rows: Row[]
    sql: string
  }> = async (criteria) => {
    const setters: string[] = []
    for (const [col, x] of Object.entries(criteria)) {
      let value: Value
      if (x === true) {
        value = 1
      } else if (x === false) {
        value = 0
      } else if (x === undefined) {
        value = undefined
      } else if (typeof x === 'string') {
        // SQLite accepts double-quoted string literals, but it seems the LibSQL
        // client I am using requires single quotes (it gives me an error if I
        // use double quotes).
        // https://www.sqlite.org/quirks.html#double_quoted_string_literals_are_accepted
        value = `'${x}'`
      } else {
        value = x
      }
      setters.push(`${col} = ${value}`)
    }

    // const client_id = 'http://localhost:3001/id'

    // const sql = [
    //   `UPDATE ${table_name}`,
    //   `SET ${setters.join(', ')}`,
    //   `WHERE client_id = '${client_id}';`
    // ].join(' ')

    // const sql = `UPDATE \`${table_name}\` SET ${setters.join(', ')};`

    let sql: string
    if (returning && returning.length > 0) {
      sql = [
        `UPDATE \`${table_name}\``,
        `SET ${setters.join(', ')}`,
        `RETURNING ${returning.join(',')};`
      ].join(' ')
    } else {
      sql = [`UPDATE \`${table_name}\``, `SET ${setters.join(', ')};`].join(' ')
    }

    try {
      const rs = await client.execute(sql)
      // rowsAffected seems to be 0 when the SQL includes RETURNING
      let n: number
      if (returning && returning.length > 0) {
        n = rs.rows.length
      } else {
        n = rs.rowsAffected
      }
      const message = `updated ${n} records in table ${table_name}`
      return { value: { message, rows: rs.rows, sql } }
    } catch (ex: any) {
      const message = `Cannot update records of database table ${table_name}: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return updateRecords
}
