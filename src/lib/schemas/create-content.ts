import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { jf2 } from './jf2.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Any()
})

const result_promise = Type.Promise(Type.Union([failure, success]))

export const create = Type.Function([jf2], result_promise)

export type Create = Static<typeof create>
