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
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defIntrospectPost } from './routes/introspect-post.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  expiration: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const introspectionEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>
  const prefix = `${NAME} `

  const report_all_ajv_errors = config.reportAllAjvErrors
  const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])

  throwIfDoesNotConform({ prefix }, ajv, options_schema, config)

  const {
    expiration,
    includeErrorDescription: include_error_description,
    isBlacklisted,
    issuer,
    jwks_url
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${prefix}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  fastify.register(responseDecorators)
  fastify.log.debug(`${prefix}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({
    include_error_description,
    log_prefix: prefix
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
    { include_error_description, log_prefix: prefix }
  )

  const validateClaimJti = defValidateClaim(
    { claim: 'jti' },
    { include_error_description, log_prefix: prefix }
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
      log_prefix: prefix,
      report_all_ajv_errors
    })

  // === ROUTES ============================================================= //
  fastify.post(
    '/introspect',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
    },
    defIntrospectPost({
      ajv,
      expiration,
      include_error_description,
      isBlacklisted,
      issuer,
      jwks_url,
      prefix
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
