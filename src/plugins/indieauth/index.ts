import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import {
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  NAME
} from './constants.js'
import { defLogin, logout } from './routes.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  authorizationCallbackRoute?: string
  authorizationEndpoint?: string
  baseUrl: string
  clientId: string
  codeChallengeMethod?: string
  codeVerifierLength?: number
  me: string
}

const defaults: Partial<PluginOptions> = {
  authorizationCallbackRoute: DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  authorizationEndpoint: DEFAULT_AUTHORIZATION_ENDPOINT,
  codeChallengeMethod: DEFAULT_CODE_CHALLENGE_METHOD,
  codeVerifierLength: DEFAULT_CODE_VERIFIER_LENGTH
}

const fastifyIndieAuth: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const {
    authorizationCallbackRoute: auth_callback,
    authorizationEndpoint: authorization_endpoint,
    baseUrl: base_url,
    clientId: client_id,
    codeChallengeMethod: code_challenge_method,
    me
  } = config

  // client ID and redirect URI of the GitHub OAuth app used to authenticate users
  // The client must be registered in the IndieLogin database. We need ask Aaron Parecki for this registration.
  // See here:
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Authenticate.php#L51
  // And here:
  // https://github.com/aaronpk/indielogin.com/issues/20

  // https://indielogin.com/api
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/.env.example#L17

  // === HOOKS ============================================================== //
  const hooks_prefix = `${NAME}/hooks `

  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${hooks_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  fastify.get(
    '/login',
    defLogin({
      authorization_endpoint,
      client_id,
      code_challenge_method,
      len: config.codeVerifierLength,
      me,
      prefix: PREFIX,
      redirect_uri: `${base_url}${auth_callback}`
    })
  )

  fastify.get('/logout', logout)

  done()
}

export default fp(fastifyIndieAuth, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
