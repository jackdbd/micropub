import type { Value } from '@libsql/client'
import stringify from 'fast-safe-stringify'
import type { BaseProps } from '../storage-api/index.js'

export type SQLiteProps = Record<string, Value>
export type SQLiteRecord = Record<string, Value>

/**
 * Casts a JS value in a way to minimize SQLite's type affinity.
 *
 * @see [Datatypes In SQLite](https://www.sqlite.org/datatype3.html)
 */
export const jsValueToSQlite = (x: any) => {
  // SQLite has a NULL storage class
  if (x === undefined || x === null) {
    return null
  }

  // SQLite does not have a separate Boolean storage class. Instead, Boolean
  // values are stored as integers 0 (false) and 1 (true).
  if (typeof x === 'boolean') {
    return x ? 1 : 0
  }

  // SQLite has 2 storage classes for numbers: REAL and INTEGER
  if (typeof x === 'number') {
    if (!isFinite(x)) {
      // SQLite does not have a textual representation of NaN values.
      // NaN is stored as a valid IEEE 754 floating-point value in SQLite's REAL
      // data type. It is not stored in the NULL storage class.
      // https://www.sqlite.org/floatingpoint.html
      // TODO: decide whether to pass NaN to SQLite, convert it to null, or throw
      // https://stackoverflow.com/questions/15569745/store-nan-values-in-sqlite-database
      return x
    }
    return x
  }

  // The SQLite INTEGER storage class can hold BIGINT and UNSIGNED BIGINT, so we
  // don't change the type.
  // See also:
  // https://github.com/drizzle-team/drizzle-orm/issues/611
  if (typeof x === 'bigint') {
    return x
  }

  // SQLite stores strings in the TEXT class using these encoding: UTF-8,
  // UTF-16BE or UTF-16LE
  if (typeof x === 'string') {
    return x
  }

  // I am not sure whether SQLite, @libsql/client or neither of the two convert
  // JS Dates. Maybe it's better to provide this conversion explicitly.
  // toISOString returns a simplified format based on ISO 8601.
  if (x instanceof Date) {
    return x.toISOString()
  }

  if (typeof x === 'symbol') {
    throw new Error(
      `Cannot store a JS symbol in SQLite without custom serialization.`
    )
  }

  if (typeof x === 'object') {
    return stringify(x)
  }

  throw new Error(`Unsupported data type: ${typeof x}`)
}

export const sqliteValueToJsValue = (x: Value) => {
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
