import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defLogIatAndExpClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'

import responseDecorators from '../response-decorators/index.js'

import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defSyndicatePost } from './routes/syndicate-post.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const fastifySyndicator: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>
  const prefix = `${NAME} `

  const { reportAllAjvErrors: report_all_ajv_errors } = config

  const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])

  throwIfDoesNotConform({ prefix }, ajv, options_schema, config)

  const {
    get,
    includeErrorDescription: include_error_description,
    isBlacklisted,
    me,
    publishedUrlToStorageLocation,
    syndicators,
    update
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

  const logIatAndExpClaims = defLogIatAndExpClaims({
    include_error_description,
    log_prefix: prefix
  })

  const validateClaimMe = defValidateClaim(
    { claim: 'me', op: '==', value: me },
    { include_error_description, log_prefix: prefix }
  )

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

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      isBlacklisted,
      log_prefix: prefix,
      report_all_ajv_errors
    })

  // === ROUTES ============================================================= //
  fastify.post(
    '/syndicate',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
      // schema: syndicator_post_request
    },
    defSyndicatePost({
      get,
      include_error_description,
      prefix,
      publishedUrlToStorageLocation,
      syndicators,
      update
    })
  )

  done()
}

export default fp(fastifySyndicator, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
