import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import responseDecorators from '../response-decorators/index.js'
import { revocation } from './routes.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'
import { unixTimestampInSeconds } from '../../lib/date.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  includeErrorDescription: boolean
  me: string
}

const defaults: Partial<PluginOptions> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthRevocationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const { includeErrorDescription: include_error_description, me } = config

  // === PLUGINS ============================================================ //
  fastify.register(responseDecorators)
  fastify.log.debug(`${PREFIX}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

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

  // === ROUTES ============================================================= //
  // https://indieauth.spec.indieweb.org/#x7-token-revocation
  fastify.post(
    '/revocation',
    {
      preHandler: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ]
      // schema: revocation_post_request
    },
    revocation
  )

  done()
}

export default fp(fastifyIndieAuthRevocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
