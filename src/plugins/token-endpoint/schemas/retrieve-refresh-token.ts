import { Static, Type } from '@sinclair/typebox'
import { refresh_token } from '../../../lib/oauth2/index.js'
import {
  refresh_token_immutable_record,
  refresh_token_mutable_record
} from '../../../lib/storage-api/index.js'

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
