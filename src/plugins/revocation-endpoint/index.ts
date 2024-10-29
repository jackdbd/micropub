import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { validateAuthorizationHeader } from '../hooks.js'
import { revocation } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-revocation-endpoint'

export interface PluginOptions extends FastifyPluginOptions {}

const defaultOptions: Partial<PluginOptions> = {}

const fastifyIndieAuthRevocationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  fastify.post(
    '/revocation',
    { onRequest: [validateAuthorizationHeader] },
    revocation
  )
  fastify.log.debug(`${NAME} route registered: POST /revocation`)
  done()
}

export default fp(fastifyIndieAuthRevocationEndpoint, {
  fastify: '5.x',
  name: NAME
})
