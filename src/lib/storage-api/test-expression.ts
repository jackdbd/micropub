import { Static, Type } from '@sinclair/typebox'

export const operation = Type.Union([
  Type.Literal('=='),
  Type.Literal('!='),
  Type.Literal('<'),
  Type.Literal('<='),
  Type.Literal('>'),
  Type.Literal('>=')
])

export type Operation = Static<typeof operation>

export const test_expression = Type.Object({
  key: Type.String({ minLength: 1 }),
  op: operation,
  // value: string | number | boolean | undefined
  value: Type.Any()
})

export type TestExpression = Static<typeof test_expression>
