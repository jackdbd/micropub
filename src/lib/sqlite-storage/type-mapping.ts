import type { Value as SQLiteValue } from '@libsql/client'
import type { BaseProps, JSValue } from '../storage-api/index.js'

// https://www.sqlite.org/datatype3.html
// export type SQLiteValue = string | number | null | BinaryType

export type SQLiteProps = Record<string, SQLiteValue>
export type SQLiteRecord = Record<string, SQLiteValue>

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
