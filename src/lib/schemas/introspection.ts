import { Static, Type } from '@sinclair/typebox'
import { info } from './info.js'
import { isBlacklisted, type IsBlacklisted } from './is-blacklisted.js'

export const storage = Type.Object({
  info,
  isBlacklisted
})

export interface Introspection extends Static<typeof storage> {
  isBlacklisted: IsBlacklisted
}
