import type { RouteHandler } from 'fastify'
import type { Options } from '../schemas/index.js'

// These configuration values are sensitive and should not be included in the
// response body.
const SENSITIVE = new Set([] as string[])

// These configuration values are not sensitive, but it does not make much sense
// to include them in the response body. Also, if we include them in a template
// (e.g. Nunjucks), the template fails to render.
const EXCLUDED = new Set(['ajv'] as string[])

const entriesToInclude = (config: Required<Options>) => {
  return Object.entries(config).filter(([key]) => {
    const hide = SENSITIVE.has(key) || EXCLUDED.has(key)
    return hide ? false : true
  })
}

export const defConfigGet = (config: Required<Options>) => {
  const { logPrefix } = config

  const configGet: RouteHandler = async (request, reply) => {
    const payload = {
      ...Object.fromEntries(entriesToInclude(config)),
      not_shown: [...EXCLUDED.keys(), ...SENSITIVE.keys()]
    }
    request.log.debug(payload, `${logPrefix}config after applying defaults`)
    return reply.code(200).send(payload)
  }

  return configGet
}
