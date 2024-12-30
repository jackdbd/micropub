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
import { DEFAULT, NAME } from './constants.js'
import { defConfigGet } from './routes/syndication-config-get.js'
import { defSyndicatePost } from './routes/syndicate-post.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const fastifySyndicator: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    includeErrorDescription: include_error_description,
    logPrefix: log_prefix,
    reportAllAjvErrors: report_all_ajv_errors
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  const {
    get,
    isAccessTokenBlacklisted,
    me,
    publishedUrlToStorageLocation,
    syndicators,
    update
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${log_prefix}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({ ajv })

  const logIatAndExpClaims = defLogIatAndExpClaims({ ajv })

  const validateClaimMe = defValidateClaim(
    { claim: 'me', op: '==', value: me },
    { ajv }
  )

  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestampInSeconds
    },
    { ajv }
  )

  const validateClaimJti = defValidateClaim({ claim: 'jti' }, { ajv })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ ajv, isAccessTokenBlacklisted })

  // === ROUTES ============================================================= //
  fastify.get('/syndication/config', defConfigGet(config))

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
    },
    defSyndicatePost({
      get,
      include_error_description,
      log_prefix,
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
