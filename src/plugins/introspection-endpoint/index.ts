import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defConfigGet } from './routes/introspection-config-get.js'
import { defIntrospectPost } from './routes/introspect-post.js'
// import { introspect_post_response_body } from './routes/schemas.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT_LOG_PREFIX,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const introspectionEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const { logPrefix: log_prefix, reportAllAjvErrors: all_ajv_errors } = config

  const ajv = addFormats(new Ajv({ allErrors: all_ajv_errors }), ['uri'])

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  const {
    includeErrorDescription: include_error_description,
    isBlacklisted,
    issuer,
    jwksUrl: jwks_url
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${log_prefix}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  fastify.register(responseDecorators)
  fastify.log.debug(`${log_prefix}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({
    include_error_description,
    log_prefix
  })

  // Should I check whether the token from the Authorization header matches an
  // expected a `me` claim?
  // const validateClaimMe = defValidateClaim(
  //   { claim: 'me', op: '==', value: me },
  //   { include_error_description, log_prefix: prefix }
  // )

  // The access token provided in the Authorization header (which may differ
  // from the token in the request body) must not be expired.
  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestampInSeconds
    },
    { include_error_description, log_prefix }
  )

  const validateClaimJti = defValidateClaim(
    { claim: 'jti' },
    { include_error_description, log_prefix }
  )

  // TODO: re-read RFC7662 and decide which scope to check
  // const validateScopeMedia = defValidateScope({
  //   scope: 'introspect',
  //   include_error_description,
  //   log_prefix: prefix
  // })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      isBlacklisted,
      log_prefix,
      report_all_ajv_errors: all_ajv_errors
    })

  // === ROUTES ============================================================= //
  fastify.get('/introspect/config', defConfigGet(config))

  fastify.post(
    '/introspect',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
      // schema: { response: { 200: introspect_post_response_body } }
    },
    defIntrospectPost({
      ajv,
      include_error_description,
      isBlacklisted,
      issuer,
      jwks_url,
      log_prefix
      // max_token_age
    })
  )

  done()
}

/**
 * Plugin that adds a token introspection endpoint to a Fastify server.
 *
 * @see [RFC7662 OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662)
 */
export default fp(introspectionEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
