import { Static, Type } from '@sinclair/typebox'
import type { Failure } from './schemas/failure.js'

export const rowid = Type.BigInt({ minLength: 1 })

export type RowId = Static<typeof rowid>

export type RetrieveRecord<V, C = string | number | boolean> = (
  column_value: C
) => Promise<Failure | { error?: undefined; value: V }>

export type RetrieveRecords<V> = (
  column_value: string | number | boolean
) => Promise<Failure | { error?: undefined; value: V[] }>

export interface BaseStoreRecordValue {
  message?: string
  rowid?: RowId
}

export type StoreRecord<
  D,
  V extends BaseStoreRecordValue = BaseStoreRecordValue
> = (datum: D) => Promise<Failure | { error?: undefined; value: V }>
