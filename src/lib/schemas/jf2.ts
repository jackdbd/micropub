// import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import { Static, Type } from '@sinclair/typebox'

const h = Type.Union([
  Type.Literal('card'),
  Type.Literal('cite'),
  Type.Literal('entry'),
  Type.Literal('event')
])

export const jf2 = Type.Object(
  {
    action: Type.Optional(Type.String()),
    date: Type.Optional(Type.String()),
    h: Type.Optional({ ...h, default: 'entry' }),
    'mp-syndicate-to': Type.Optional(Type.Any()),
    syndication: Type.Optional(Type.Any())
  },
  { additionalProperties: true }
)

export type JF2 = Static<typeof jf2>
