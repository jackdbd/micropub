import type { DeleteQuery, SelectQuery, UpdateQuery } from './query.js'
import type { BaseProps, BaseRecord } from './types.js'

export type RemoveRecords<
  R extends BaseRecord = BaseRecord,
  E extends Error = Error
> = (
  query?: DeleteQuery
) => Promise<
  { error: E; value?: undefined } | { error?: undefined; value: R[] }
>

export type RetrieveRecord<
  Selected extends BaseRecord = BaseRecord,
  E extends Error = Error
> = (
  query: SelectQuery
) => Promise<
  { error: E; value?: undefined } | { error?: undefined; value: Selected }
>

export type RetrieveRecords<
  Selected extends BaseRecord = BaseRecord,
  E extends Error = Error
> = (
  query?: SelectQuery
) => Promise<
  { error: E; value?: undefined } | { error?: undefined; value: Selected[] }
>

export type UpdateRecords<
  R extends BaseRecord = BaseRecord,
  E extends Error = Error
> = (
  query: UpdateQuery
) => Promise<
  { error: E; value?: undefined } | { error?: undefined; value: R[] }
>

export type StoreRecord<
  Props extends BaseProps = BaseProps,
  Returning extends BaseRecord = BaseRecord,
  E extends Error = Error
> = (
  props: Props
) => Promise<
  { error: E; value?: undefined } | { error?: undefined; value: Returning }
>

export interface StorageApi<Selected extends BaseRecord = BaseRecord> {
  removeMany: RemoveRecords
  retrieveOne: RetrieveRecord<Selected>
  retrieveMany: RetrieveRecords
  storeOne: StoreRecord
  updateMany: UpdateRecords
}
