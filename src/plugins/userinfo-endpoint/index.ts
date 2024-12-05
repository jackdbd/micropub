import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim,
  defValidateScope
} from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import { userinfo } from './routes.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  includeErrorDescription: boolean
  me: string
}

const defaults: Partial<PluginOptions> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthUserinfoEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const { includeErrorDescription: include_error_description, me } = config

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

  // === HOOKS ============================================================== //
  const log_prefix = `${NAME}/hooks `

  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({
    include_error_description,
    log_prefix
  })

  const validateClaimMe = defValidateClaim(
    { claim: 'me', op: '==', value: me },
    { include_error_description, log_prefix }
  )

  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestampInSeconds
    },
    { include_error_description, log_prefix }
  )

  const validateClaimJti = defValidateClaim(
    { claim: 'jti' },
    { include_error_description, log_prefix }
  )

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      log_prefix
    })

  const validateScopeEmail = defValidateScope({
    scope: 'email',
    include_error_description,
    log_prefix
  })

  const validateScopeProfile = defValidateScope({
    scope: 'profile',
    include_error_description,
    log_prefix
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
        validateScopeProfile
      ],
      preHandler: [validateAccessTokenNotBlacklisted]
      // schema: userinfo_get_request
    },
    userinfo
  )

  done()
}

export default fp(fastifyIndieAuthUserinfoEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
