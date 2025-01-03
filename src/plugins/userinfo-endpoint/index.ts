import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { profile } from '../../lib/indieauth/index.js'
import { error_response } from '../../lib/oauth2/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { DEFAULT, NAME } from './constants.js'
import { defUserinfoGet } from './routes/userinfo-get.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const userinfoEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    // isAccessTokenBlacklisted,
    includeErrorDescription: include_error_description,
    logPrefix: log_prefix,
    // me,
    reportAllAjvErrors: report_all_ajv_errors
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  // === PLUGINS ============================================================ //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({ ajv })

  // const validateClaimMe = defValidateClaim(
  //   { claim: 'me', op: '==', value: me },
  //   { ajv }
  // )

  // const validateClaimExp = defValidateClaim(
  //   {
  //     claim: 'exp',
  //     op: '>',
  //     value: unixTimestampInSeconds
  //   },
  //   { ajv }
  // )

  // const validateClaimJti = defValidateClaim({ claim: 'jti' }, { ajv })

  // const validateAccessTokenNotBlacklisted =
  //   defValidateAccessTokenNotBlacklisted({ ajv, isAccessTokenBlacklisted })

  // const validateScopeEmail = defValidateScope({ ajv, scope: 'email' })

  // const validateScopeProfile = defValidateScope({ ajv, scope: 'profile' })

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
        // decodeJwtAndSetClaims,
        // validateClaimExp,
        // validateClaimMe,
        // validateClaimJti,
        // validateScopeEmail,
        // validateScopeProfile,
        // validateAccessTokenNotBlacklisted
      ],
      schema: {
        // body: '',
        response: { 200: profile, '4xx': error_response, '5xx': error_response }
      }
    },
    defUserinfoGet({ include_error_description, log_prefix })
  )

  done()
}

export default fp(userinfoEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
