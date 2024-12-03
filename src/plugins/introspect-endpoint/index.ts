import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { defValidateAuthorizationHeader } from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import { NAME } from './constants.js'
import { defIntrospect } from './routes.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  clientId: string
  include_error_description: boolean
}

const defaultOptions: Partial<PluginOptions> = {
  include_error_description: false
}

const fastifyIndieAuthIntrospectionEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>

  const { clientId: client_id, include_error_description } = config

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

  // https://indieauth.spec.indieweb.org/#access-token-verification-request
  // OAuth 2.0 Token Introspection
  // https://www.rfc-editor.org/rfc/rfc7662
  fastify.post(
    '/introspect',
    { onRequest: [validateAuthorizationHeader] },
    defIntrospect({ client_id, include_error_description })
  )

  done()
}

export default fp(fastifyIndieAuthIntrospectionEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
