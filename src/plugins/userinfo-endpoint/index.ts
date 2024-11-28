import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import responseDecorators from '../response-decorators/index.js'
import { userinfo } from './routes.js'
import { NAME } from './constants.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  include_error_description: boolean
}

const defaultOptions: Partial<PluginOptions> = {
  include_error_description: false
}

const fastifyIndieAuthUserinfoEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${PREFIX}configuration`)

  // const { include_error_description } = config

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

  // === HOOKS ============================================================== //
  const hooks_prefix = `${NAME}/hooks `

  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${hooks_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  // https://indieauth.spec.indieweb.org/#user-information
  // https://indieauth.spec.indieweb.org/#profile-information
  fastify.get('/userinfo', userinfo)

  done()
}

export default fp(fastifyIndieAuthUserinfoEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
