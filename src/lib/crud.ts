import { Static, Type } from '@sinclair/typebox'
import type { Failure, UpdatePatch } from './schemas/index.js'

export const rowid = Type.BigInt({ minLength: 1 })

export type RowId = Static<typeof rowid>

export type RetrieveRecord<V, C = string | number | boolean> = (
  column_value: C
) => Promise<Failure | { error?: undefined; value: V }>

export type Value = string | number | boolean | undefined

export type Criterium = { [key: string]: Value }

export type Criteria = Record<string, Value>

export type RetrieveRecords<V> = (
  criteria?: Criteria
) => Promise<Failure | { error?: undefined; value: V[] }>

export interface BaseStoreRecordValue {
  message?: string
  rowid?: RowId
}

export type StoreRecord<
  D,
  V extends BaseStoreRecordValue = BaseStoreRecordValue
> = (datum: D) => Promise<Failure | { error?: undefined; value: V }>

export interface BaseUpdateRecordsValue {
  message?: string
  // records?: any[]
  patches?: UpdatePatch[]
  // rows?: any[]
  // rows_affected?: number
  sql?: string
}

export type UpdateRecords<
  V extends BaseUpdateRecordsValue = BaseUpdateRecordsValue,
  E extends Error = Error
> = (
  criteria: Criteria
) => Promise<{ error: E; value?: undefined } | { error?: undefined; value: V }>
