import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { defCallback } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-authorization-endpoint'

export interface PluginOptions extends FastifyPluginOptions {
  clientId: string
  redirectUri: string
  tokenEndpoint: string
}

const defaultOptions: Partial<PluginOptions> = {}

const fastifyIndieAuthAuthorizationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  const callback = defCallback({
    client_id: config.clientId,
    prefix: NAME,
    redirect_uri: config.redirectUri,
    token_endpoint: config.tokenEndpoint
  })

  fastify.get('/callback', callback)
  fastify.log.debug(`${NAME} route registered: GET /callback`)

  done()
}

export default fp(fastifyIndieAuthAuthorizationEndpoint, {
  fastify: '5.x',
  name: NAME
})
