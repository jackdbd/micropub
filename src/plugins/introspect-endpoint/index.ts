import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { defValidateAuthorizationHeader } from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'
import { defIntrospect } from './routes.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  clientId: string
  includeErrorDescription: boolean
}

const defaults: Partial<PluginOptions> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthIntrospectionEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const {
    clientId: client_id,
    includeErrorDescription: include_error_description
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  const log_prefix = `${NAME}/hooks `

  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const validateAuthorizationHeader = defValidateAuthorizationHeader({
    include_error_description,
    log_prefix
  })

  // === ROUTES ============================================================= //

  // https://indieauth.spec.indieweb.org/#access-token-verification-request
  // OAuth 2.0 Token Introspection
  // https://www.rfc-editor.org/rfc/rfc7662
  fastify.post(
    '/introspect',
    { preHandler: [validateAuthorizationHeader] },
    defIntrospect({ client_id, include_error_description })
  )

  done()
}

export default fp(fastifyIndieAuthIntrospectionEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
