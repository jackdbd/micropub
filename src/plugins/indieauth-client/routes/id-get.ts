import type { RouteHandler } from 'fastify'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'

export interface Config {
  client_id: string
  client_name: string
  client_uri: string
  log_prefix: string
  logo_uri: string
  redirect_uris: string[]
}

// Clients SHOULD have a JSON document at their client_id URL containing client
// metadata defined in [RFC7591].
// https://indieauth.spec.indieweb.org/#client-metadata
// https://datatracker.ietf.org/doc/html/rfc7591

export const defIdGet = (config: Config) => {
  const {
    client_id,
    client_name,
    client_uri,
    log_prefix,
    logo_uri,
    redirect_uris
  } = config

  const idGet: RouteHandler = (request, reply) => {
    request.log.debug(`${log_prefix}serving IndieAuth client metadata`)
    // In IndieAuth the client ID is a URL
    // const client_id = 'https://indiebookclub.biz/id'
    // const client_uri = 'https://indiebookclub.biz/'
    // logo_uri: 'https://indiebookclub.biz/images/book.svg',
    // redirect_uris: ['https://indiebookclub.biz/auth/callback']

    const payload = {
      client_id,
      client_name,
      client_uri,
      logo_uri,
      redirect_uris
    }

    if (clientAcceptsHtml(request)) {
      return reply.successResponse(200, {
        title: 'Client metadata',
        description: 'Metadata of the IndieAuth/Micropub client',
        summary: `Metadata of the IndieAuth/Micropub client ID ${client_id}.`,
        payload
      })
    } else {
      return reply.code(200).send(payload)
    }
  }

  return idGet
}
