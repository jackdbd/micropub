import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { ajv, report_all_ajv_errors } from '../../schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object({
  ajv: Type.Optional(ajv),

  claimsSessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.CLAIMS_SESSION_KEY })
  ),

  logPrefix: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.LOG_PREFIX })
  ),

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  sessionKey: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.SESSION_KEY })
  )
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
}

// According to jose's JWTPayload interface, the aud claim could be string or string[].
export const value = Type.Union([
  Type.String({ minLength: 1 }),
  Type.Array(Type.String({ minLength: 1 })),
  Type.Number(),
  Type.Boolean(),
  Type.Undefined()
])

export type Value = Static<typeof value>

export const operation = Type.Union([
  Type.Literal('=='),
  Type.Literal('!='),
  Type.Literal('<'),
  Type.Literal('<='),
  Type.Literal('>'),
  Type.Literal('>=')
])

export type Operation = Static<typeof operation>

export const assertion = Type.Object({
  claim: Type.String({ minLength: 1 }),
  op: Type.Optional(operation),
  value: Type.Optional(Type.Union([value, Type.Any()]))
})

export interface Assertion extends Static<typeof assertion> {
  value?: Value | Function
}
