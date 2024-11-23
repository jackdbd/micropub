import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { userinfo } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-userinfo-endpoint'

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
  fastify.log.debug(config, `${NAME} configuration`)

  // const { include_error_description } = config

  // https://indieauth.spec.indieweb.org/#user-information
  // https://indieauth.spec.indieweb.org/#profile-information
  fastify.get('/userinfo', userinfo)
  fastify.log.debug(`${NAME} route registered: POST /userinfo`)

  done()
}

export default fp(fastifyIndieAuthUserinfoEndpoint, {
  fastify: '5.x',
  name: NAME
})
