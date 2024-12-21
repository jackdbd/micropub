import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { client_metadata } from '../../lib/indieauth/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_LOGO_URI,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defAuthCallback } from './routes/auth-callback.js'
import { defAuthStartGet } from './routes/auth-start.js'
import { defEditor } from './routes/editor-get.js'
import { defIdGet } from './routes/id-get.js'
import { defLogin } from './routes/login-get.js'
import { defLogout } from './routes/logout-get.js'
import { postAccepted } from './routes/post-accepted-get.js'
import { postCreated } from './routes/post-created-get.js'
import { defSubmit } from './routes/submit-post.js'
import { options as options_schema, type Options } from './schemas.js'
import { auth_start_get_request_querystring } from './routes/schemas.js'

const defaults: Partial<Options> = {
  codeVerifierLength: DEFAULT_CODE_VERIFIER_LENGTH,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  logoUri: DEFAULT_LOGO_URI,
  logPrefix: DEFAULT_LOG_PREFIX,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

// This Fastify plugin should be both an IndieAuth client and a Micropub client.

const indieAuthClient: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const { logPrefix: log_prefix, reportAllAjvErrors: all_ajv_errors } = config

  const ajv = addFormats(new Ajv({ allErrors: all_ajv_errors }), ['uri'])

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  const {
    authorizationEndpoint: authorization_endpoint,
    authorizationCallbackRoute: auth_callback_path,
    authorizationStartRoute: auth_start_path,
    clientId: client_id,
    clientName: client_name,
    clientUri: client_uri,
    codeVerifierLength: code_verifier_length,
    includeErrorDescription: include_error_description,
    issuer,
    logoUri: logo_uri,
    micropubEndpoint: micropub_endpoint,
    redirectUris: redirect_uris,
    revocationEndpoint: revocation_endpoint,
    submitEndpoint: submit_endpoint,
    tokenEndpoint: token_endpoint
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

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${log_prefix}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  const redirect_uri = redirect_uris[0] // `${base_url}${auth_callback_path}`

  fastify.get(
    auth_callback_path,
    {
      onRequest: [],
      onResponse: [],
      schema: { querystring: {}, response: {} }
    },
    defAuthCallback({
      client_id,
      include_error_description,
      log_prefix,
      redirect_uri,
      token_endpoint
    })
  )

  // auth_start_path is a route available on this IndieAuth/Micropub client, but
  // the login page could be hosted somewhere else, so we could do:
  // const auth_start_endpoint = `${base_url}${auth_start_path}`

  const auth_start_endpoint = auth_start_path

  fastify.get(
    auth_start_path,
    { schema: { querystring: auth_start_get_request_querystring } },
    defAuthStartGet({
      authorization_endpoint,
      code_verifier_length,
      include_error_description,
      issuer,
      log_prefix,
      redirect_uri
    })
  )

  fastify.get('/editor', defEditor({ log_prefix, submit_endpoint }))

  fastify.get('/accepted', postAccepted)

  fastify.get('/created', postCreated)

  fastify.post('/submit', defSubmit({ log_prefix, micropub_endpoint }))

  fastify.get(
    '/id',
    { schema: { response: { 200: client_metadata } } },
    defIdGet({
      client_id,
      client_name,
      client_uri,
      log_prefix,
      logo_uri,
      redirect_uris
    })
  )

  fastify.get(
    '/login',
    defLogin({ auth_start_endpoint, client_id, log_prefix })
  )

  fastify.get(
    '/logout',
    defLogout({ include_error_description, log_prefix, revocation_endpoint })
  )

  done()
}

export default fp(indieAuthClient, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
