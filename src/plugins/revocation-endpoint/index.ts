import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
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

  // const {
  //   validatePluginOptions,
  // } = compileSchemasAndGetValidateFunctions()
  // fastify.log.debug(
  //   `${NAME} compiled JSON schemas and created validate functions`
  // )

  // validatePluginOptions(config)

  // if (validatePluginOptions.errors) {
  //   const details = validatePluginOptions.errors.map((err) => {
  //     return `${err.instancePath.slice(1)} ${err.message}`
  //   })
  //   throw new Error(
  //     `${NAME} plugin registered using invalid options: ${details.join('; ')}`
  //   )
  // }
  // fastify.log.debug(`${NAME} validated its configuration`)

  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  fastify.post('/revocation', revocation)
  fastify.log.debug(`${NAME} route registered: POST /revocation`)

  done()
}

export default fp(fastifyIndieAuthRevocationEndpoint, {
  fastify: '5.x',
  name: NAME
})
