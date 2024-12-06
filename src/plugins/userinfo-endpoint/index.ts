import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim,
  defValidateScope
} from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { userinfo } from './routes/userinfo-get.js'
import { options as options_schema, type Options } from './schemas.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const userinfoEndpoint: FastifyPluginCallback<Options> = (
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
    includeErrorDescription: include_error_description,
    me,
    store
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${prefix}registered plugin: responseDecorators`)

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
      isBlacklisted: store.isBlacklisted,
      log_prefix: prefix,
      report_all_ajv_errors
    })

  const validateScopeEmail = defValidateScope({
    scope: 'email',
    include_error_description,
    log_prefix: prefix
  })

  const validateScopeProfile = defValidateScope({
    scope: 'profile',
    include_error_description,
    log_prefix: prefix
  })

  // === ROUTES ============================================================= //
  // To fetch the user's profile information, the client makes a GET request to
  // the userinfo endpoint, providing an access token that was issued with the
  // `profile` and/or `email` scopes.
  // https://indieauth.spec.indieweb.org/#user-information
  // https://indieauth.spec.indieweb.org/#profile-information
  fastify.get(
    '/userinfo',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateScopeEmail,
        validateScopeProfile,
        validateAccessTokenNotBlacklisted
      ]
      // schema: userinfo_get_request
    },
    userinfo
  )

  done()
}

export default fp(userinfoEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
