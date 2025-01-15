import { Static, Type } from '@sinclair/typebox'
import { jti } from '../jwt/index.js'
import {
  access_token_props,
  revocation_reason
} from '../token-storage-interface/index.js'
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

const retrieveAccessToken_description = `Function that retrieves an access token from a storage backend.`
const retrieveAccessToken_title = 'retrieveAccessToken'

const retrieveAccessToken_ = Type.Function(
  [jti],
  Type.Promise(
    Type.Union([access_token_immutable_record, access_token_mutable_record])
  ),
  {
    description: retrieveAccessToken_description,
    title: retrieveAccessToken_title
  }
)

/**
 * Function that retrieves an access token from a storage backend.
 */
export type RetrieveAccessToken = Static<typeof retrieveAccessToken_>

/**
 * Function that retrieves an access token from a storage backend.
 */
export const retrieveAccessToken = Type.Any({
  description: retrieveAccessToken_description,
  title: retrieveAccessToken_title
})

const isAccessTokenRevoked_description = `Predicate function that returns true if a jti (JSON Web Token ID) is revoked.`
const isAccessTokenRevoked_title = 'isAccessTokenRevoked'

// AFAIK, Type.Function and Type.Promise cannot be used with a standard JSON
// Schema validators. However, we can still use them to generate TypeScript types.
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const isAccessTokenRevoked_ = Type.Function(
  [jti],
  Type.Promise(Type.Boolean()),
  {
    description: isAccessTokenRevoked_description,
    title: isAccessTokenRevoked_title
  }
)

/**
 * Predicate function that returns true if a jti (JSON Web Token ID) is revoked.
 * This function will most likely need to access a storage backend in order to
 * come up with an answer.
 */
export type IsAccessTokenRevoked = Static<typeof isAccessTokenRevoked_>

/**
 * Predicate function that returns true if a jti (JSON Web Token ID) is revoked.
 * This function will most likely need to access a storage backend in order to
 * come up with an answer.
 */
export const isAccessTokenRevoked = Type.Any({
  description: isAccessTokenRevoked_description,
  title: isAccessTokenRevoked_title
})

const revokeAccessToken_description = `Handler invoked when the token revocation endpoint has met all requirements to revoke a token. You should use it to mark the access token as revoked in your storage backend.`

const revokeAccessToken_title = 'revokeAccessToken'

const props = Type.Object({
  jti,
  revocation_reason: Type.Optional(revocation_reason)
})

export type RevokeAccessTokenProps = Static<typeof props>

const revokeAccessToken_ = Type.Function([props], Type.Promise(Type.Void()), {
  description: revokeAccessToken_description,
  title: revokeAccessToken_title
})

export type RevokeAccessToken = Static<typeof revokeAccessToken_>

export const revokeAccessToken = Type.Any({
  description: revokeAccessToken_description,
  title: revokeAccessToken_title
})
