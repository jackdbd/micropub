import { unixTimestampInMs } from '../date.js'
import type {
  BaseProps,
  DeleteQuery,
  Query,
  SelectQuery,
  UpdateQuery
} from '../storage-api/index.js'
import { jsValueToSQlite } from './type-mapping.js'

export interface Config {
  query: Query
  table: string
}

export const setClause = (set: { [key: string]: any }) => {
  const expressions = Object.entries(set).map(([key, value]) => {
    const val = jsValueToSQlite(value)
    return `\`${key}\` = '${val}'`
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
    const val = jsValueToSQlite(value)

    switch (op) {
      case '==': {
        return `\`${key}\` = '${val}'`
      }
      case '!=': {
        return `\`${key}\` != '${val}'`
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
  const returning = query.returning || Object.keys(query.set).join(', ')

  return `
  UPDATE \`${table}\` 
    SET ${setClause({ ...query.set, updated_at: unixTimestampInMs() })} 
  WHERE
    ${whereClause(query)} 
  RETURNING
    ${returning};`
}

export const insertQuery = (table: string, props: BaseProps) => {
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
