import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'
import {
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted
} from './is-blacklisted.js'

export const storage = Type.Object({
  info,
  isAccessTokenBlacklisted
})

export interface Introspection extends Static<typeof storage> {
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
}
