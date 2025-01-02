import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { access_token_request_body } from '../authorization-endpoint/index.js'
import { access_token_response_body_success } from './routes/schemas.js'
import { defConfigGet } from './routes/token-config-get.js'
import { defTokenPost } from './routes/token-post.js'
import { DEFAULT, NAME } from './constants.js'
import { options as options_schema, type Options } from './schemas.js'

export {
  access_token_response_body_success,
  type AccessTokenResponseBodySuccess
} from './routes/schemas.js'

const defaults: Partial<Options> = {
  accessTokenExpiration: DEFAULT.ACCESS_TOKEN_EXPIRATION,
  authorizationEndpoint: DEFAULT.AUTHORIZATION_ENDPOINT,
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  refreshTokenExpiration: DEFAULT.REFRESH_TOKEN_EXPIRATION,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const tokenEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    accessTokenExpiration: access_token_expiration,
    authorizationEndpoint: authorization_endpoint,
    includeErrorDescription: include_error_description,
    issuer,
    jwks,
    logPrefix: log_prefix,
    refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors: report_all_ajv_errors,
    storeAccessToken
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

  fastify.log.debug(
    `${log_prefix}access token expiration: ${access_token_expiration}`
  )
  fastify.log.debug(
    `${log_prefix}refresh token expiration: ${refresh_token_expiration}`
  )

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
  fastify.get('/token/config', defConfigGet(config))

  fastify.post(
    '/token',
    {
      schema: {
        body: access_token_request_body,
        response: { '2xx': access_token_response_body_success }
      }
    },
    defTokenPost({
      access_token_expiration,
      ajv,
      authorization_endpoint,
      include_error_description,
      issuer,
      jwks,
      log_prefix,
      storeAccessToken
    })
  )

  done()
}

export default fp(tokenEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
