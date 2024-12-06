import { Static, Type } from '@sinclair/typebox'
import { error } from './error.js'

export const failure = Type.Object({
  error,
  value: Type.Optional(Type.Undefined())
})

export type Failure = Static<typeof failure>
