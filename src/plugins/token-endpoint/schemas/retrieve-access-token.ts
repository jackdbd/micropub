import { Static, Type } from '@sinclair/typebox'
import { jti } from '../../../lib/jwt/index.js'
import {
  access_token_immutable_record,
  access_token_mutable_record
} from '../../../lib/storage-api/index.js'

const description = `Function that retrieves an access token from a storage backend.`

const title = 'retrieveAccessToken'

const retrieveAccessToken_ = Type.Function(
  [jti],
  Type.Promise(
    Type.Union([access_token_immutable_record, access_token_mutable_record])
  ),
  { description, title }
)

/**
 * Function that retrieves an access token from a storage backend.
 */
export type RetrieveAccessToken = Static<typeof retrieveAccessToken_>

/**
 * Function that retrieves an access token from a storage backend.
 */
export const retrieveAccessToken = Type.Any({ description, title })
