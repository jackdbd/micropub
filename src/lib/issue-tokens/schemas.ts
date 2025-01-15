import { Type, type Static } from '@sinclair/typebox'

export const expiration = Type.String({
  description: `Human-readable expiration time for the token issued by the token endpoint.`,
  minLength: 1,
  title: 'Token expiration'
})

export const log_function_ = Type.Function(
  [Type.String(), Type.Any()],
  Type.Void()
)

export type LogFunction = Static<typeof log_function_>

export const log_function = Type.Any()

export const logger = Type.Object({
  debug: log_function
})
