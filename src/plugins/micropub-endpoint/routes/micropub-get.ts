import type { RouteHandler } from 'fastify'
import type { SyndicateToItem } from '../syndication.js'

export interface Config {
  media_endpoint: string
  syndicate_to: SyndicateToItem[]
}

/**
 * https://micropub.spec.indieweb.org/#configuration
 */
export const defMicropubGet = (config: Config) => {
  const { media_endpoint, syndicate_to } = config

  const micropubGet: RouteHandler = (_request, reply) => {
    const payload = {
      'media-endpoint': media_endpoint,
      'syndicate-to': syndicate_to
    }

    return reply.successResponse(200, {
      title: 'Micropub config',
      description: 'Configuration page for this micropub endpoint.',
      summary: 'Configuration for this micropub endpoint.',
      payload
    })
  }

  return micropubGet
}
