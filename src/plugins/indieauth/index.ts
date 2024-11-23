import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { defLogin, logout } from './routes.js'

const NAME = '@jackdbd/fastify-indieauth'
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

const defaultOptions: Partial<PluginOptions> = {
  authorizationCallbackRoute: '/auth/callback',
  authorizationEndpoint: 'https://indieauth.com/auth',
  codeChallengeMethod: 'S256',
  codeVerifierLength: 128
}

const fastifyIndieAuth: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${PREFIX}configuration`)

  const {
    authorizationCallbackRoute: auth_callback,
    authorizationEndpoint: authorization_endpoint,
    baseUrl: base_url,
    clientId: client_id,
    codeChallengeMethod: code_challenge_method,
    me
  } = config

  const redirect_uri = `${base_url}${auth_callback}`

  // authorization_endpoint: 'https://indielogin.com/auth',
  // client ID and redirect URI of the GitHub OAuth app used to authenticate users
  // The client must be registered in the IndieLogin database. We need ask Aaron Parecki for this registration.
  // See here:
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Authenticate.php#L51
  // And here:
  // https://github.com/aaronpk/indielogin.com/issues/20

  // https://indielogin.com/api
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/.env.example#L17

  fastify.get(
    '/login',
    defLogin({
      authorization_endpoint,
      client_id,
      code_challenge_method,
      len: config.codeVerifierLength,
      me,
      prefix: PREFIX,
      redirect_uri
    })
  )
  fastify.log.debug(`${PREFIX}route registered: GET /login`)

  fastify.get('/logout', logout)
  fastify.log.debug(`${PREFIX}route registered: GET /logout`)

  done()
}

export default fp(fastifyIndieAuth, {
  fastify: '5.x',
  name: NAME
})
