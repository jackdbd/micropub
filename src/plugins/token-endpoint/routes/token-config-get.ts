import type { RouteHandler } from 'fastify'
import type { Options } from '../schemas.js'

// These configuration values are not sensitive, but if we include them in the
// template, the template fails to render.
const FAIL_TO_RENDER = new Set(['ajv'] as string[])

const SENSITIVE = new Set(['jwks'])

const entriesSafeToRender = (config: Required<Options>) => {
  return Object.entries(config).filter(([key]) => {
    const hide = SENSITIVE.has(key) || FAIL_TO_RENDER.has(key)
    return hide ? false : true
  })
}

export const defConfigGet = (config: Required<Options>) => {
  const configGet: RouteHandler = async (_request, reply) => {
    return reply.code(200).send({
      ...Object.fromEntries(entriesSafeToRender(config)),
      not_shown: [...FAIL_TO_RENDER.keys(), ...SENSITIVE.keys()]
    })
  }

  return configGet
}
