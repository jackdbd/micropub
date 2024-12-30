import type { RouteHandler } from 'fastify'

export interface Config {
  /**
   * URL that identifies the client (in IndieAuth, the client ID is a URL).
   */
  client_id: string
  client_name: string
  client_uri: string
  log_prefix: string
  logo_uri: string
  redirect_uris: string[]
}

/**
 * Serves the metadata of this IndieAuth/Micropub client.
 *
 * Clients SHOULD have a JSON document at their client_id URL containing client
 * metadata defined in [RFC7591 - OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591).
 *
 * @see [Client Metadata - IndieAuth spec](https://indieauth.spec.indieweb.org/#client-metadata)
 */
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
    const metadata = {
      client_id,
      client_name,
      client_uri,
      logo_uri,
      redirect_uris
    }

    request.log.debug(metadata, `${log_prefix}client metadata`)
    return reply.code(200).send(metadata)
  }

  return idGet
}
