import { Static, Type } from '@sinclair/typebox'
import { access_token_props } from '../token-storage-interface/index.js'
import { immutable_record, mutable_record } from './record.js'

export const access_token_immutable_record = Type.Object(
  {
    ...immutable_record.properties,
    ...access_token_props.properties
  },
  {
    $id: 'access-token-immutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of an access token. The values of this 
    record should never change. Any updates to the underlying entity should 
    create a new record.`,
    title: 'Access Token Immutable Record'
  }
)

export type AccessTokenImmutableRecord = Static<
  typeof access_token_immutable_record
>

export const access_token_mutable_record = Type.Object(
  {
    ...mutable_record.properties,
    ...access_token_props.properties
  },
  {
    $id: 'access-token-mutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of an access token with a predefined set 
    of properties (columns). While the structure of the record remains 
    consistent, the values of these properties may change over time.`,
    title: 'Access Token Mutable Record'
  }
)

export type AccessTokenMutableRecord = Static<
  typeof access_token_mutable_record
>
