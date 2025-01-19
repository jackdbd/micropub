import { unixTimestampInMs } from '../date.js'
import type {
  BaseProps,
  DeleteQuery,
  Query,
  SelectQuery,
  TestExpression,
  UpdateQuery
} from '../storage-api/index.js'
import { jsValueToSQlite } from './type-mapping.js'

export interface Config {
  query: Query
  table: string
}

export const unsupportedOperation = ({ key, op, value }: TestExpression) => {
  return new Error(`${key} ${op} ${value} is not supported`)
}

export const setClause = (set: { [key: string]: any }) => {
  const expressions = Object.entries(set).map(([key, value]) => {
    const val = jsValueToSQlite(value)
    return `\`${key}\` = '${val}'`
  })
  return expressions.join(', ')
}

interface WhereConfig {
  condition?: 'AND' | 'OR'
  expressions: TestExpression[]
}

// Remember that WHERE can be composed by multiple expressions.
// SELECT *
// FROM suppliers
// WHERE
//   (state = 'California' AND supplier_id <> 900) OR
//   (supplier_id = 100);
export const whereClause = (config: WhereConfig) => {
  const condition = config.condition || 'AND'

  const expressions = config.expressions.map(({ key, op, value }) => {
    const val = jsValueToSQlite(value)

    switch (op) {
      case '==': {
        return `\`${key}\` = '${val}'`
      }
      case '!=': {
        return `\`${key}\` != '${val}'`
      }
      case '<': {
        if (isFinite(val as any)) {
          return `\`${key}\` < '${val}'`
        } else {
          throw unsupportedOperation({ key, op, value })
        }
      }
      case '<=': {
        if (isFinite(val as any)) {
          return `\`${key}\` <= '${val}'`
        } else {
          throw unsupportedOperation({ key, op, value })
        }
      }
      case '>': {
        if (isFinite(val as any)) {
          return `\`${key}\` > '${val}'`
        } else {
          throw unsupportedOperation({ key, op, value })
        }
      }
      case '>=': {
        if (isFinite(val as any)) {
          return `\`${key}\` >= '${val}'`
        } else {
          throw unsupportedOperation({ key, op, value })
        }
      }
      default: {
        throw unsupportedOperation({ key, op, value })
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
  if (query && query.where && query.where.length > 0) {
    where = whereClause({
      condition: query.condition,
      expressions: query.where
    })
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
    ${whereClause({ condition: query.condition, expressions: query.where })} 
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

  let where: string | undefined
  if (query && query.where && query.where.length > 0) {
    where = whereClause({
      condition: query.condition,
      expressions: query.where
    })
  }

  if (query && where) {
    const returning = query.where!.map(({ key }) => key).join(', ')
    return `DELETE FROM \`${table}\` WHERE ${where} RETURNING ${returning};`
  }

  return `DELETE FROM \`${table}\` RETURNING *;`
}
