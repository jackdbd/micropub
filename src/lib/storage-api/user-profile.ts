import { Static, Type } from '@sinclair/typebox'
import { user_profile_props } from '../profile-storage-interface/index.js'
import { immutable_record, mutable_record } from './record.js'

export const user_profile_immutable_record = Type.Object(
  {
    ...immutable_record.properties,
    ...user_profile_props.properties
  },
  {
    $id: 'user-profile-immutable-record',
    additionalProperties: false,
    description: `Represents a record of a user's profile. The values of this
    record should never change. Any updates to the underlying entity should 
    create a new record.`,
    title: 'User Profile Immutable Record'
  }
)

export type UserProfileImmutableRecord = Static<
  typeof user_profile_immutable_record
>

export const user_profile_mutable_record = Type.Object(
  {
    ...mutable_record.properties,
    ...user_profile_props.properties
  },
  {
    $id: 'user-profile-mutable-record',
    // $schema: 'https://json-schema.org/draft/2020-12/schema',
    additionalProperties: false,
    description: `Represents a record of a user's profile with a predefined set
    of properties (columns). While the structure of the record remains 
    consistent, the values of these properties may change over time.`,
    title: `User's Profile Mutable Record`
  }
)

export type UserProfileMutableRecord = Static<
  typeof user_profile_mutable_record
>
