import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import responseDecorators from '../response-decorators/index.js'
import { defValidateAuthorizationHeader } from '../../lib/fastify-hooks/index.js'
import { revocation } from './routes.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  include_error_description: boolean
}

const defaults: Partial<PluginOptions> = {
  include_error_description: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthRevocationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const { include_error_description } = config

  const validateAuthorizationHeader = defValidateAuthorizationHeader({
    include_error_description,
    log_prefix: PREFIX
  })

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

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
