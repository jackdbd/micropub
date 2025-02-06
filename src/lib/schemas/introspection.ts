import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '@jackdbd/indieauth/schemas/user-provided-functions'
import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'

export const storage = Type.Object({
  info,
  isAccessTokenRevoked: isAccessTokenRevoked
})

export interface Introspection extends Static<typeof storage> {
  isAccessTokenRevoked: IsAccessTokenRevoked
}
