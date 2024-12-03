import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import {
  defValidateAuthorizationHeader,
  defValidateScope
} from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import { userinfo } from './routes.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  include_error_description: boolean
}

const defaults: Partial<PluginOptions> = {
  include_error_description: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthUserinfoEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const { include_error_description } = config

  const validateAuthorizationHeader = defValidateAuthorizationHeader({
    include_error_description,
    log_prefix: PREFIX
  })

  const validateScopeEmail = defValidateScope({
    scope: 'email',
    include_error_description,
    log_prefix: PREFIX
  })

  const validateScopeProfile = defValidateScope({
    scope: 'profile',
    include_error_description,
    log_prefix: PREFIX
  })

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
  // To fetch the user's profile information, the client makes a GET request to
  // the userinfo endpoint, providing an access token that was issued with the
  // `profile` and/or `email` scopes.
  // https://indieauth.spec.indieweb.org/#user-information
  // https://indieauth.spec.indieweb.org/#profile-information
  fastify.get(
    '/userinfo',
    {
      onRequest: [
        validateAuthorizationHeader,
        validateScopeEmail,
        validateScopeProfile
      ]
    },
    userinfo
  )

  done()
}

export default fp(fastifyIndieAuthUserinfoEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
