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
import { defRevokeJWT } from '../../lib/token-storage-interface/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defRevocationPost } from './routes/revocation-post.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const revocationEndpoint: FastifyPluginCallback<Options> = (
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
    includeErrorDescription: include_error_description,
    isBlacklisted,
    issuer,
    jwks_url,
    markTokenAsRevoked,
    maxTokenAge: max_token_age,
    me
  } = config

  const revokeJWT = defRevokeJWT({
    issuer,
    jwks_url,
    markTokenAsRevoked,
    max_token_age
  })

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
  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  // The token to be revoked is NOT NECESSARILY the same token found in the
  // Authorization header is the access token to be revoked.
  fastify.post(
    '/revocation',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
      // schema: revocation_post_request
    },
    defRevocationPost({
      include_error_description,
      me,
      prefix,
      revokeJWT
    })
  )

  done()
}

export default fp(revocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
