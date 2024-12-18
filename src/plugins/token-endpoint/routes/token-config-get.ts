import type { RouteHandler } from 'fastify'
import type { Options } from '../schemas.js'

// export interface Config {
//   log_prefix: string
//   config: Required<Options>
// }

const SENSITIVE = new Set(['jwks'])

const unsentiveEntries = (config: Required<Options>) => {
  return Object.entries(config).filter(([key]) => {
    return SENSITIVE.has(key) ? false : true
  })
}

export const defConfigGet = (config: Required<Options>) => {
  const sensitive_fields = [...SENSITIVE]
  const non_sensitive = Object.fromEntries(unsentiveEntries(config))

  const configGet: RouteHandler = async (_request, reply) => {
    return reply.successResponse(200, {
      title: 'Token endpoint configuration',
      description: 'Configuration page for this token endpoint.',
      summary: 'Configuration of this token endpoint.',
      payload: {
        non_sensitive,
        sensitive_fields
      }
    })
  }

  return configGet
}
