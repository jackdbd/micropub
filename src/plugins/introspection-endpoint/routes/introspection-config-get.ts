import type { RouteHandler } from 'fastify'
import type { Options } from '../schemas.js'

// These configuration values are not sensitive, but if we include them in the
// template, the template fails to render.
const FAIL_TO_RENDER = new Set(['ajv'] as string[])

const SENSITIVE = new Set([] as string[])

const entriesSafeToRender = (config: Required<Options>) => {
  return Object.entries(config).filter(([key]) => {
    const hide = SENSITIVE.has(key) || FAIL_TO_RENDER.has(key)
    return hide ? false : true
  })
}

export const defConfigGet = (config: Required<Options>) => {
  const configGet: RouteHandler = async (_request, reply) => {
    return reply.successResponse(200, {
      title: 'Introspection endpoint configuration',
      description: 'Configuration page for this introspection endpoint.',
      summary: 'Configuration of this introspection endpoint.',
      payload: {
        ...Object.fromEntries(entriesSafeToRender(config)),
        not_shown: [...FAIL_TO_RENDER.keys(), ...SENSITIVE.keys()]
      }
    })
  }

  return configGet
}
