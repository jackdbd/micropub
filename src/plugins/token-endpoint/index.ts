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

import { defTokenGet } from './routes/token-get.js'
import { defTokenPost } from './routes/token-post.js'
import { options as options_schema, type Options } from './schemas.js'
import {
  DEFAULT_ACCESS_TOKEN_EXPIRATION,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'

const defaults: Partial<Options> = {
  authorizationEndpoint: DEFAULT_AUTHORIZATION_ENDPOINT,
  expiration: DEFAULT_ACCESS_TOKEN_EXPIRATION,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const tokenEndpoint: FastifyPluginCallback<Options> = (
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
    addToIssuedTokens,
    authorizationEndpoint: authorization_endpoint,
    expiration,
    includeErrorDescription: include_error_description,
    isBlacklisted,
    issuer,
    jwks
  } = config

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${prefix}registered plugin: formbody`)

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
    { include_error_description, log_prefix: prefix }
  )

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      isBlacklisted,
      log_prefix: prefix,
      report_all_ajv_errors
    })

  const issueJWT = defIssueJWT({
    addToIssuedTokens,
    expiration,
    issuer,
    jwks
  })

  // === ROUTES ============================================================= //
  fastify.get(
    '/token',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateAccessTokenNotBlacklisted
      ]
      // schema: token_get_request
    },
    defTokenGet({ include_error_description, log_prefix: prefix })
  )

  fastify.post(
    '/token',
    {
      // onRequest: [],
      // onSend: [
      //   (_request, _reply, payload, done) => {
      //     done()
      //   }
      // ]
      // onResponse: [
      //   (request, _reply, done) => {
      //     done()
      //   }
      // ]
      // schema: token_post_request
    },
    defTokenPost({
      authorization_endpoint,
      include_error_description,
      issueJWT,
      log_prefix: prefix
    })
  )

  done()
}

export default fp(tokenEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
