import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { validateAuthorizationHeader } from '../hooks.js'
import { defIntrospect } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-introspection-endpoint'

export interface PluginOptions extends FastifyPluginOptions {
  clientId: string
}

const defaultOptions: Partial<PluginOptions> = {}

const fastifyIndieAuthIntrospectionEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  const { clientId: client_id } = config

  // https://indieauth.spec.indieweb.org/#access-token-verification-request
  // OAuth 2.0 Token Introspection
  // https://www.rfc-editor.org/rfc/rfc7662
  fastify.post(
    '/introspect',
    { onRequest: [validateAuthorizationHeader] },
    defIntrospect({ client_id })
  )
  fastify.log.debug(`${NAME} route registered: POST /introspect`)
  done()
}

export default fp(fastifyIndieAuthIntrospectionEndpoint, {
  fastify: '5.x',
  name: NAME
})
