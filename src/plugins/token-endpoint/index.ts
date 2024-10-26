import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { defTokenPost, defTokenGet } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth-token-endpoint'

export interface PluginOptions extends FastifyPluginOptions {
  algorithm?: string
  authorizationEndpoint: string
  baseUrl: string
  expiration?: string
  issuer: string
}

const defaultOptions: Partial<PluginOptions> = {
  algorithm: 'HS256',
  expiration: '2 hours'
}

const fastifyIndieAuthTokenEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  // const {
  //   validatePluginOptions,
  // } = compileSchemasAndGetValidateFunctions()
  fastify.log.debug(
    `${NAME} compiled JSON schemas and created validate functions`
  )

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

  const { baseUrl, issuer } = config
  const prefix = NAME

  fastify.get('/token', defTokenGet({ base_url: baseUrl, prefix }))
  fastify.log.debug(`${NAME} route registered: GET /token`)

  // indiekit for `issuer` uses `application.url`
  fastify.post(
    '/token',
    defTokenPost({
      algorithm: config.algorithm,
      authorization_endpoint: config.authorizationEndpoint,
      base_url: baseUrl,
      expiration: config.expiration,
      issuer,
      prefix
    })
  )
  fastify.log.debug(`${NAME} route registered: POST /token`)

  done()
}

export default fp(fastifyIndieAuthTokenEndpoint, {
  fastify: '5.x',
  name: NAME
})
