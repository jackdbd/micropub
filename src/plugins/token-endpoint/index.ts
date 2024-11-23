import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_ALGORITHM,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  NAME
} from './constants.js'
import { tokenErrorResponse } from './decorators.js'
import { defTokenPost, defTokenGet } from './routes.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  algorithm?: string
  authorizationEndpoint?: string
  baseUrl: string
  expiration?: string
  issuer: string // Indiekit uses `application.url`
}

const defaultOptions: Partial<PluginOptions> = {
  algorithm: DEFAULT_ALGORITHM,
  authorizationEndpoint: DEFAULT_AUTHORIZATION_ENDPOINT,
  expiration: DEFAULT_ACCESS_TOKEN_EXPIRATION
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
  fastify.log.debug(config, `${PREFIX}configuration`)

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

  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${PREFIX}registered Fastify plugin: formbody`)

  const {
    algorithm,
    authorizationEndpoint: authorization_endpoint,
    baseUrl: base_url,
    expiration,
    issuer
  } = config

  fastify.decorateReply('tokenErrorResponse', tokenErrorResponse)
  fastify.log.debug(`${PREFIX}decorateReply: tokenErrorResponse`)

  fastify.get('/token', defTokenGet({ base_url, prefix: PREFIX }))
  fastify.log.debug(`${PREFIX}route registered: GET /token`)

  fastify.post(
    '/token',
    defTokenPost({
      algorithm,
      authorization_endpoint,
      expiration,
      issuer,
      prefix: PREFIX
    })
  )
  fastify.log.debug(`${PREFIX}route registered: POST /token`)

  done()
}

export default fp(fastifyIndieAuthTokenEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
