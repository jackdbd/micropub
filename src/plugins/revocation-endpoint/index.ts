import formbody from '@fastify/formbody'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defValidateAccessTokenNotBlacklisted,
  defValidateClaim
} from '../../lib/fastify-hooks/index.js'
import type { TokenStore } from '../../lib/micropub/store/index.js'
import responseDecorators from '../response-decorators/index.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'
import { defRevocationPost } from './routes/revocation-post.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  includeErrorDescription: boolean
  me: string
  store: TokenStore
}

const defaults: Partial<PluginOptions> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifyIndieAuthRevocationEndpoint: FastifyPluginCallback<
  PluginOptions
> = (fastify, options, done) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const {
    includeErrorDescription: include_error_description,
    me,
    store
  } = config

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${PREFIX}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

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
  // The token to be revoked is NOT NECESSARILY the same token found in the
  // Authorization header is the access token to be revoked.
  fastify.post(
    '/revocation',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti
      ],
      preHandler: [validateAccessTokenNotBlacklisted]
      // schema: revocation_post_request
    },
    defRevocationPost({
      include_error_description,
      me,
      prefix: `${NAME}/routes `,
      store
    })
  )

  done()
}

export default fp(fastifyIndieAuthRevocationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
