import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_ALGORITHM,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  NAME
} from './constants.js'
import { defTokenPost, defTokenGet } from './routes.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  algorithm?: string
  authorizationEndpoint?: string
  expiration?: string
  includeErrorDescription?: boolean
  issuer: string // Indiekit uses `application.url` Maybe I can use request.url? Or reply.server.url?
}

const defaults: Partial<PluginOptions> = {
  algorithm: DEFAULT_ALGORITHM,
  authorizationEndpoint: DEFAULT_AUTHORIZATION_ENDPOINT,
  expiration: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthTokenEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const {
    algorithm,
    authorizationEndpoint: authorization_endpoint,
    expiration,
    includeErrorDescription: include_error_description,
    issuer
  } = config

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${PREFIX}registered plugin: formbody`)

  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${PREFIX}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  fastify.get(
    '/token',
    defTokenGet({ include_error_description, log_prefix: `${NAME}/routes ` })
  )

  fastify.post(
    '/token',
    defTokenPost({
      algorithm,
      authorization_endpoint,
      include_error_description,
      expiration,
      issuer,
      log_prefix: `${NAME}/routes `
    })
  )

  done()
}

export default fp(fastifyIndieAuthTokenEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
