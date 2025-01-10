import { Static, Type } from '@sinclair/typebox'
import { client_application_props } from '../clients-storage-interface/index.js'
import { immutable_record, mutable_record } from './record.js'

export const client_application_immutable_record = Type.Object(
  {
    ...immutable_record.properties,
    ...client_application_props.properties
  },
  {
    $id: 'client-application-immutable-record',
    additionalProperties: false,
    description: `Represents a record of a client application. The values of
    this record should never change. Any updates to the underlying entity should 
    create a new record.`,
    title: 'Client Application Immutable Record'
  }
)

export type ClientApplicationImmutableRecord = Static<
  typeof client_application_immutable_record
>

export const client_application_mutable_record = Type.Object(
  {
    ...mutable_record.properties,
    ...client_application_props.properties
  },
  {
    $id: 'client-application-mutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of a client application with a predefined
    set of properties (columns). While the structure of the record remains 
    consistent, the values of these properties may change over time.`,
    title: `Client Application Mutable Record`
  }
)

export type ClientApplicationMutableRecord = Static<
  typeof client_application_mutable_record
>
