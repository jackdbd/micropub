import { Static, Type } from '@sinclair/typebox'
import { exp } from '../jwt/index.js'
import { failure } from '../schemas/failure.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const result_promise = Type.Promise(Type.Union([failure, success]))

// TODO: see OAuth 2.0 and IndieAuth to know how this authorization code is defined.
const code = Type.String({
  minLength: 10,
  maxLength: 128,
  description: 'Authorization code. Should be single-use.'
})

const payload = Type.Object({ code, exp })

export type Payload = Static<typeof payload>

const addToIssuedCodes_ = Type.Function([payload], result_promise)

export type AddToIssuedCodes = Static<typeof addToIssuedCodes_>

export const addToIssuedCodes = Type.Any()

const issueCode_ = Type.Function([payload], result_promise)

export type IssueCode = Static<typeof issueCode_>

export const issueCode = Type.Any()

const DESCRIPTION = 'Mark an authorization code as used.'

export const markCodeAsUsed_ = Type.Function([code], result_promise, {
  $id: 'mark-code-as-used!',
  description: DESCRIPTION
})

export type MarkCodeAsUsed = Static<typeof markCodeAsUsed_>

export const markCodeAsUsed = Type.Any({
  description: DESCRIPTION
})

// const verifyCode_ = Type.Function([code], result_promise)

// export type VerifyCode = Static<typeof verifyCode_>

// export const verifyCode = Type.Any()
