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
import { defAuthStartGet } from './routes/auth-start.js'
import { defIdGet } from './routes/id-get.js'
import { defLogin } from './routes/login-get.js'
import { defLogout } from './routes/logout-get.js'
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
    clientId: client_id,
    clientName: client_name,
    clientUri: client_uri,
    codeVerifierLength: code_verifier_length,
    includeErrorDescription: include_error_description,
    logoUri: logo_uri,
    redirectUris: redirect_uris,
    revocationEndpoint: revocation_endpoint
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
  // This is a route available on this IndieAuth client
  const auth_start_path = '/auth/start'

  // This should be a URL I think, so the login form can be independent from
  // the IndieAuth client.
  // const auth_start_endpoint = `${base_url}${auth_start_path}`
  const auth_start_endpoint = auth_start_path

  fastify.get(
    auth_start_path,
    { schema: { querystring: auth_start_get_request_querystring } },
    defAuthStartGet({
      code_verifier_length,
      include_error_description,
      log_prefix,
      redirect_uri: redirect_uris[0] // `${base_url}${auth_callback}`
    })
  )

  fastify.get(
    '/id',
    { schema: { response: { 200: client_metadata } } },
    defIdGet({
      client_id,
      client_name,
      client_uri,
      log_prefix,
      logo_uri,
      redirect_uris // [`${base_url}${auth_callback}`]
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
