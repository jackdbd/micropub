import { Static, Type } from '@sinclair/typebox'
import { refresh_token } from '../oauth2/index.js'
import {
  refresh_token_props,
  revocation_reason
} from '../token-storage-interface/index.js'
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

const description = `Function that retrieves a refresh token from a storage backend.`
const title = 'retrieveRefreshToken'

const retrieveRefreshToken_ = Type.Function(
  [refresh_token],
  Type.Promise(
    Type.Union([refresh_token_immutable_record, refresh_token_mutable_record])
  ),
  { description, title }
)

/**
 * Function that retrieves a refresh token from a storage backend.
 */
export type RetrieveRefreshToken = Static<typeof retrieveRefreshToken_>

/**
 * Function that retrieves a refresh token from a storage backend.
 */
export const retrieveRefreshToken = Type.Any({ description, title })

const revokeRefreshToken_description = `Handler invoked when the token revocation endpoint has met all requirements to revoke a token. You should use it to mark the refresh token as revoked in your storage backend.`

const revokeRefreshToken_title = 'revokeRefreshToken'

const props = Type.Object({
  refresh_token,
  revocation_reason: Type.Optional(revocation_reason)
})

export type RevokeRefreshTokenProps = Static<typeof props>

const revokeRefreshToken_ = Type.Function([props], Type.Promise(Type.Void()), {
  description: revokeRefreshToken_description,
  title: revokeRefreshToken_title
})

export type RevokeRefreshToken = Static<typeof revokeRefreshToken_>

export const revokeRefreshToken = Type.Any({
  description: revokeRefreshToken_description,
  title: revokeRefreshToken_title
})
