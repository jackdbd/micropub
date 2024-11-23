import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
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
