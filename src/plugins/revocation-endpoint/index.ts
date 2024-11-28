import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import responseDecorators from '../response-decorators/index.js'
import { defValidateAuthorizationHeader } from '../../lib/fastify-hooks/index.js'
import { revocation } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-revocation-endpoint'

export interface PluginOptions extends FastifyPluginOptions {
  include_error_description: boolean
}

const defaultOptions: Partial<PluginOptions> = {
  include_error_description: false
}

const fastifyIndieAuthRevocationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  const { include_error_description } = config

  const validateAuthorizationHeader = defValidateAuthorizationHeader({
    include_error_description,
    log_prefix: `${NAME} `
  })

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${NAME} registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  const hooks_prefix = `${NAME}/hooks `

  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${hooks_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  fastify.post(
    '/revocation',
    { onRequest: [validateAuthorizationHeader] },
    revocation
  )

  done()
}

export default fp(fastifyIndieAuthRevocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
