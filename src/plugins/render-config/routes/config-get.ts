import type { RouteHandler } from 'fastify'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'

const entriesToInclude = (
  config: Record<string, any>,
  excluded: Set<string>
) => {
  return Object.entries(config).filter(([key]) => {
    return excluded.has(key) ? false : true
  })
}

export const defConfigGet = (x: any) => {
  const config = x.config
  const excluded = new Set<string>(x.exclude)

  const configGet: RouteHandler = async (request, reply) => {
    const payload = {
      ...Object.fromEntries(entriesToInclude(config, excluded)),
      not_shown: [...excluded]
    }
    request.log.debug(payload, `plugin config`)

    if (clientAcceptsHtml(request)) {
      return reply.successResponse(200, {
        title: 'Config',
        description: 'Configuration page',
        summary: 'Configuration',
        payload
      })
    } else {
      return reply.code(200).send(payload)
    }
  }

  return configGet
}
