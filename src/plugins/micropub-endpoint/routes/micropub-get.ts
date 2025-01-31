import type { RouteHandler } from 'fastify'
import type { SyndicateToItem } from '@jackdbd/micropub/syndicate-to'

export interface Config {
  media_endpoint: string
  syndicate_to: SyndicateToItem[]
}

/**
 * [Configuration](https://micropub.spec.indieweb.org/#configuration) of this Micropub endpoint.
 */
export const defMicropubGet = (config: Config) => {
  const { media_endpoint, syndicate_to } = config

  const micropubGet: RouteHandler = (_request, reply) => {
    const payload = {
      'media-endpoint': media_endpoint,
      'syndicate-to': syndicate_to
    }

    return reply.code(200).send(payload)
  }

  return micropubGet
}
