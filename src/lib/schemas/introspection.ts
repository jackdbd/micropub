import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from './is-access-token-revoked.js'

export const storage = Type.Object({
  info,
  isAccessTokenRevoked: isAccessTokenRevoked
})

export interface Introspection extends Static<typeof storage> {
  isAccessTokenRevoked: IsAccessTokenRevoked
}
