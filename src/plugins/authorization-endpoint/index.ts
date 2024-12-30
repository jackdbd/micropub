import formbody from '@fastify/formbody'
// import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { DEFAULT, NAME } from './constants.js'
import { defConfigGet } from './routes/authorization-config-get.js'
import { defAuthorizeGet } from './routes/authorize-get.js'
import { defAuthorizePost } from './routes/authorize-post.js'
import { defConsent } from './routes/consent.js'
import {
  access_token_request_body,
  authorization_request_querystring,
  authorization_response_body_success,
  consent_request_querystring
} from './routes/schemas.js'
import { options as options_schema, type Options } from './schemas.js'

export {
  access_token_request_body,
  type AccessTokenRequestBody,
  authorization_response_querystring,
  type AuthorizationResponseQuerystring
} from './routes/schemas.js'

const defaults: Partial<Options> = {
  authorizationCodeExpiration: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  redirectUrlOnDeny: DEFAULT.REDIRECT_URL_ON_DENY,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const authorizationEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    // accessTokenExpiration: access_token_expiration,
    authorizationCodeExpiration: authorization_code_expiration,
    includeErrorDescription: include_error_description,
    issuer,
    logPrefix: log_prefix,
    markAuthorizationCodeAsUsed,
    redirectUrlOnDeny: redirect_url_on_deny,
    // refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors: report_all_ajv_errors,
    retrieveAuthorizationCode,
    storeAuthorizationCode
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  // const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>()

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${log_prefix}registered plugin: formbody`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  fastify.get('/auth/config', defConfigGet(config))

  fastify.get(
    '/auth',
    {
      schema: {
        querystring: authorization_request_querystring
      }
    },
    defAuthorizeGet({
      // access_token_expiration,
      authorization_code_expiration,
      include_error_description,
      log_prefix,
      redirect_url_on_deny
      // refresh_token_expiration
    })
  )

  fastify.post(
    '/auth',
    {
      schema: {
        body: access_token_request_body,
        response: { '2xx': authorization_response_body_success }
      }
    },
    defAuthorizePost({
      include_error_description,
      log_prefix,
      markAuthorizationCodeAsUsed,
      retrieveAuthorizationCode
    })
  )

  fastify.get(
    '/consent',
    // TODO: redirect if not authenticated.
    // Before issuing an authorization code, the authorization server MUST first
    // verify the identity of the resource owner.
    { onRequest: [], schema: { querystring: consent_request_querystring } },
    defConsent({
      authorization_code_expiration,
      issuer,
      log_prefix,
      redirect_url_on_deny,
      storeAuthorizationCode
    })
  )

  done()
}

export default fp(authorizationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
