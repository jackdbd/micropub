import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { url } from './url.js'

export const action = Type.Union([
  Type.Literal('delete'),
  Type.Literal('undelete'),
  Type.Literal('update'),
  Type.Literal('create')
])

export type Action = Static<typeof action>

const update_patch = Type.Object({
  add: Type.Optional(Type.Any()),
  delete: Type.Optional(Type.String({ minLength: 1 })),
  replace: Type.Optional(Type.Any())
})

export type UpdatePatch = Static<typeof update_patch>

// export interface UpdatePatch {
//   delete?: string
//   add?: Record<string, any>
//   replace?: Record<string, any>
// }

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Any()
})

const result_promise = Type.Promise(Type.Union([failure, success]))

const update_ = Type.Function([url, update_patch], result_promise)

export type Update = Static<typeof update_>

export const update = Type.Any()
