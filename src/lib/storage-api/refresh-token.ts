import { Static, Type } from '@sinclair/typebox'
import { refresh_token_props } from '../token-storage-interface/index.js'
import { immutable_record, mutable_record } from './record.js'

export const refresh_token_immutable_record = Type.Object(
  {
    ...immutable_record.properties,
    ...refresh_token_props.properties
  },
  {
    $id: 'refresh-token-immutable-record',
    additionalProperties: false,
    description: `Represents a record of a refresh token. The values of this
    record should never change. Any updates to the underlying entity should 
    create a new record.`,
    title: 'Refresh Token Immutable Record'
  }
)

export type RefreshTokenImmutableRecord = Static<
  typeof refresh_token_immutable_record
>

export const refresh_token_mutable_record = Type.Object(
  {
    ...mutable_record.properties,
    ...refresh_token_props.properties
  },
  {
    $id: 'refresh-token-mutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of a refresh token with a predefined set 
    of properties (columns). While the structure of the record remains 
    consistent, the values of these properties may change over time.`,
    title: 'Refresh Token Mutable Record'
  }
)

export type RefreshTokenMutableRecord = Static<
  typeof refresh_token_mutable_record
>
