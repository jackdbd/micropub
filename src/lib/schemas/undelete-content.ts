import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { url } from './url.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({})
})

const result_promise = Type.Promise(Type.Union([failure, success]))

export const undelete = Type.Function([url], result_promise)

export type Undelete = Static<typeof undelete>
