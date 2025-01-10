import { Static, Type } from '@sinclair/typebox'
import { authorization_code_props } from '../authorization-code-storage-interface/index.js'
import { immutable_record, mutable_record } from './record.js'

export const authorization_code_immutable_record = Type.Object(
  {
    ...immutable_record.properties,
    ...authorization_code_props.properties
  },
  {
    $id: 'authorization-code-immutable-record',
    additionalProperties: false,
    description: `Represents a record of an authorization code. The values of
    this record should never change. Any updates to the underlying entity should 
    create a new record.`,
    title: 'Authorization Code Immutable Record'
  }
)

export type AuthorizationCodeImmutableRecord = Static<
  typeof authorization_code_immutable_record
>

export const authorization_code_mutable_record = Type.Object(
  {
    ...mutable_record.properties,
    ...authorization_code_props.properties
  },
  {
    $id: 'authorization-code-mutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of an authorization code with a predefined
    set of properties (columns). While the structure of the record remains 
    consistent, the values of these properties may change over time.`,
    title: 'Authorization Code Mutable Record'
  }
)

export type AuthorizationCodeMutableRecord = Static<
  typeof authorization_code_mutable_record
>
