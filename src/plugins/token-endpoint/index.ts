import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import { defIssueJWT } from '../../lib/token-storage-interface/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'

import { defConfigGet } from './routes/token-config-get.js'
import { defTokenGet } from './routes/token-get.js'
import { defTokenPost } from './routes/token-post.js'
import { options as options_schema, type Options } from './schemas.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REFRESH_TOKEN_EXPIRATION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'

const defaults: Partial<Options> = {
  accessTokenExpiration: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  authorizationEndpoint: DEFAULT_AUTHORIZATION_ENDPOINT,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT_LOG_PREFIX,
  refreshTokenExpiration: DEFAULT_REFRESH_TOKEN_EXPIRATION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const tokenEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const { logPrefix: log_prefix, reportAllAjvErrors: all_ajv_errors } = config

  const ajv = addFormats(new Ajv({ allErrors: all_ajv_errors }), ['uri'])

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  const {
    accessTokenExpiration: access_token_expiration,
    addToIssuedTokens,
    authorizationEndpoint: authorization_endpoint,
    includeErrorDescription: include_error_description,
    introspectionEndpoint: introspection_endpoint,
    isBlacklisted,
    issuer,
    jwks,
    refreshTokenExpiration: refresh_token_expiration
  } = config

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

  fastify.register(responseDecorators)
  fastify.log.debug(`${log_prefix}registered plugin: responseDecorators`)

  fastify.setErrorHandler(function (error, request, reply) {
    // `this` is the fastify instance
    const code = reply.statusCode
    if (code >= 400 && code < 500) {
      request.log.warn(`${log_prefix}${error.message} (status: ${code})`)
    }

    // TODO: maybe redirect only if client Accept header is text/html
    if (code === 401) {
      return reply.redirect('/login', 302)
    }

    return reply.view('error.njk', {
      title: error.name,
      description: 'Some error description',
      error: error.name,
      error_description: error.message
    })
  })

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({ log_prefix })

  // const validateClaimMe = defValidateClaim(
  //   { claim: 'me', op: '==', value: me },
  //   { include_error_description, log_prefix: prefix }
  // )

  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestampInSeconds
    },
    { include_error_description, log_prefix }
  )

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      isBlacklisted,
      log_prefix,
      report_all_ajv_errors: all_ajv_errors
    })

  // === ROUTES ============================================================= //
  const issueJWT = defIssueJWT({
    addToIssuedTokens,
    expiration: access_token_expiration,
    issuer,
    jwks
  })

  fastify.get('/token/config', defConfigGet(config))

  fastify.get(
    '/token',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateAccessTokenNotBlacklisted
      ]
    },
    defTokenGet({
      include_error_description,
      introspection_endpoint,
      log_prefix
    })
  )

  fastify.post(
    '/token',
    {
      // schema: token_post_request
    },
    defTokenPost({
      authorization_endpoint,
      include_error_description,
      issueJWT,
      log_prefix
    })
  )

  done()
}

export default fp(tokenEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
