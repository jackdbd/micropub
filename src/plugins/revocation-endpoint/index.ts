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
import { DEFAULT, NAME } from './constants.js'
import { defConfigGet } from './routes/revocation-config-get.js'
import { defRevocationPost } from './routes/revocation-post.js'
import { options as options_schema, type Options } from './schemas.js'

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
    isAccessTokenBlacklisted,
    issuer,
    jwksUrl: jwks_url,
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

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ ajv, isAccessTokenBlacklisted })

  // === ROUTES ============================================================= //
  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  // The token to be revoked is NOT NECESSARILY the same token found in the
  // Authorization header is the access token to be revoked.

  fastify.get('/revoke/config', defConfigGet(config))

  fastify.post(
    '/revoke',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
    },
    defRevocationPost({ include_error_description, log_prefix, me, revokeJWT })
  )

  done()
}

export default fp(revocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
