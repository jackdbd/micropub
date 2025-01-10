import type { Value } from '@libsql/client'
import type {
  BaseProps,
  DeleteQuery,
  JSValue,
  Query,
  SelectQuery,
  UpdateQuery
} from '../storage-api/index.js'
import { unixTimestampInMs } from '../date.js'

// https://www.sqlite.org/datatype3.html
export type SQLiteValue = string | number | null | BinaryType
// export type SQLiteValue = any

export type SQLiteProps = Record<string, SQLiteValue>
// export type SQLiteRecord = Record<string, SQLiteValue>
export type SQLiteRecord = Record<string, Value>

export interface Config {
  query: Query
  table: string
}

export const setClause = (query: UpdateQuery) => {
  const expressions = Object.entries(query.set).map(([key, value]) => {
    return `\`${key}\` = '${value}'`
  })
  return expressions.join(', ')
}

// Remember that WHERE can be composed by multiple expressions.
// SELECT *
// FROM suppliers
// WHERE
//   (state = 'California' AND supplier_id <> 900) OR
//   (supplier_id = 100);
export const whereClause = (query: SelectQuery | UpdateQuery | DeleteQuery) => {
  const condition = query.condition || 'AND'

  const expressions = query.where.map(({ key, op, value }) => {
    switch (op) {
      case '==': {
        return `\`${key}\` = '${value}'`
      }
      case '!=': {
        return `\`${key}\` != '${value}'`
      }
      default: {
        throw new Error(`unsupported operator: ${op}`)
      }
    }
  })

  return expressions.join(` ${condition} `)
}

export const selectQuery = (table: string, query?: SelectQuery) => {
  let select: string
  if (query && query.select) {
    select = query.select.join(', ')
  } else {
    select = '*'
  }

  let where: string | undefined
  if (query) {
    where = whereClause(query)
  }

  if (where) {
    return `SELECT ${select} FROM \`${table}\` WHERE ${where};`
  } else {
    return `SELECT ${select} FROM \`${table}\`;`
  }
}

export const updateQuery = (table: string, query: UpdateQuery) => {
  const now = unixTimestampInMs()

  const where = whereClause(query)
  const returning = Object.keys(query.set).join(', ')

  return `
  UPDATE \`${table}\` 
    SET ${setClause({ ...query, set: { ...query.set, updated_at: now } })} 
  WHERE
    ${where} 
  RETURNING
    ${returning};`
}

export const insertQuery = (table: string, props: SQLiteProps) => {
  const now = unixTimestampInMs()

  const query = {
    values: { ...props, created_at: now, updated_at: now }
  }

  const columns: string[] = []
  const values: string[] = []
  const returning: string[] = []
  for (const [key, _value] of Object.entries(query.values)) {
    columns.push(key)
    values.push(`:${key}`)
    returning.push(key)
  }

  // Instead of relying on implicit column ordering, we explicitly specify the
  // column names. This ensures that the placeholders match the correct columns
  // regardless of the order in VALUES.
  const sql = `
  INSERT INTO \`${table}\`
    (${columns.join(', ')})
  VALUES
    (${values.join(', ')})
  RETURNING
    ${returning.join(', ')};
  `

  return { sql, args: query.values }
}

export const deleteQuery = (table: string, query?: DeleteQuery) => {
  // Support soft delete pattern?
  // const now = unixTimestampInMs()
  // const query = {
  //   values: { ...props, deleted_at: now }
  // }

  if (query) {
    const where = whereClause(query)
    const returning = query.where.map(({ key }) => key).join(', ')
    return `DELETE FROM \`${table}\` WHERE ${where} RETURNING ${returning};`
  } else {
    return `DELETE FROM \`${table}\` RETURNING *;`
  }
}

export const jsValueToSQlite = (x: JSValue) => {
  if (x === undefined) {
    return null
  }

  if (x === true) {
    return 1
  }

  if (x === false) {
    return 0
  }

  if (typeof x === 'symbol') {
    // TODO: what to do here?
    // const symbol_as_string = x.toString()
    throw new Error(`I am not sure I can store a JS symbol in SQLite`)
  }

  return x
}

export const sqliteValueToJsValue = (x: SQLiteValue) => {
  if (x === null) {
    return undefined
  }

  if (x === 1) {
    return true
  }

  if (x === 0) {
    return false
  }

  return x
}

export const jsPropsToSQLite = (props: BaseProps) => {
  const hash_map = Object.entries(props).reduce((acc, [key, value]: any) => {
    return { ...acc, [key]: jsValueToSQlite(value) }
  }, {} as SQLiteProps)

  return hash_map
}

export const sqliteRecordToJS = (record: SQLiteRecord) => {
  const hash_map = Object.entries(record).reduce((acc, [key, value]: any) => {
    return { ...acc, [key]: sqliteValueToJsValue(value) }
  }, {} as SQLiteRecord)

  return hash_map
}
