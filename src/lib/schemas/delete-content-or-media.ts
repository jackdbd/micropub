import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { url } from './url.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Any()
})

const result_promise = Type.Promise(Type.Union([failure, success]))

const deleteContentOrMedia_ = Type.Function([url], result_promise)

export type DeleteContentOrMedia = Static<typeof deleteContentOrMedia_>

export const deleteContentOrMedia = Type.Any()
