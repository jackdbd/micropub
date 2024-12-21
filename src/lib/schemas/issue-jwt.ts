import { Static, Type } from '@sinclair/typebox'
import { exp, jti, jwt } from '../jwt/index.js'
import { failure } from './failure.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    claims: Type.Object({ exp, jti }),
    jwt,
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

const payload = Type.Object({})

const result_promise = Type.Promise(Type.Union([failure, success]))

const issueJWT_ = Type.Function([payload], result_promise)

export type IssueJWT = Static<typeof issueJWT_>

export const issueJWT = Type.Any()
