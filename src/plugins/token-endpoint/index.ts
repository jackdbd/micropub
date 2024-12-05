import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import type { JWK } from 'jose'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  NAME
} from './constants.js'
import { defTokenGet } from './routes/token-get.js'
import { defTokenPost } from './routes/token-post.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  authorizationEndpoint?: string
  expiration?: string
  includeErrorDescription?: boolean
  jwks: { keys: JWK[] }
  jwks_url: URL
  issuer: string // Indiekit uses `application.url` Maybe I can use request.url? Or reply.server.url?
}

const defaults: Partial<PluginOptions> = {
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
    authorizationEndpoint: authorization_endpoint,
    expiration,
    includeErrorDescription: include_error_description,
    issuer,
    jwks,
    jwks_url
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
      authorization_endpoint,
      include_error_description,
      expiration,
      issuer,
      jwks,
      jwks_url,
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
