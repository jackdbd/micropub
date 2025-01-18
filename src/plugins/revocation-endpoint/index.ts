import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotRevoked,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import { error_response } from '../../lib/oauth2/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { DEFAULT, NAME } from './constants.js'
import { defRevocationPost } from './routes/revocation-post.js'
import {
  options as options_schema,
  type Options,
  revocation_request_body,
  revocation_response_body_success
} from './schemas/index.js'

export type {
  RevocationRequestBody,
  RevocationResponseBodySuccess
} from './schemas/index.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const revocationEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    includeErrorDescription: include_error_description,
    isAccessTokenRevoked,
    issuer,
    jwksUrl: jwks_url,
    logPrefix: log_prefix,
    maxAccessTokenAge: max_access_token_age,
    me,
    reportAllAjvErrors: report_all_ajv_errors,
    retrieveAccessToken,
    retrieveRefreshToken,
    revokeAccessToken,
    revokeRefreshToken
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

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

  const validateAccessTokenNotBlacklisted = defValidateAccessTokenNotRevoked({
    ajv,
    isAccessTokenRevoked
  })

  // === ROUTES ============================================================= //
  fastify.post(
    '/revoke',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ],
      schema: {
        body: revocation_request_body,
        response: {
          200: revocation_response_body_success,
          '4xx': error_response,
          '5xx': error_response
        }
      }
    },
    defRevocationPost({
      ajv,
      include_error_description,
      issuer,
      jwks_url,
      log_prefix,
      max_access_token_age,
      me,
      retrieveAccessToken,
      retrieveRefreshToken,
      revokeAccessToken,
      revokeRefreshToken
    })
  )

  done()
}

export default fp(revocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
