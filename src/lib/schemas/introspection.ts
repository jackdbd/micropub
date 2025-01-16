import { Static, Type } from '@sinclair/typebox'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '../storage-api/index.js'
import { info } from './info.js'

export const storage = Type.Object({
  info,
  isAccessTokenRevoked: isAccessTokenRevoked
})

export interface Introspection extends Static<typeof storage> {
  isAccessTokenRevoked: IsAccessTokenRevoked
}
