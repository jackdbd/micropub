import formbody from '@fastify/formbody'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { unixTimestampInSeconds } from '../../lib/date.js'
import { defDecodeJwtAndSetClaims } from '../../lib/fastify-hooks/decode-jwt-and-set-claims.js'
import { defLogIatAndExpClaims } from '../../lib/fastify-hooks/log-iat-and-exp-claims.js'
import { defValidateClaim } from '../../lib/fastify-hooks/validate-claim.js'
import { defValidateAccessTokenNotBlacklisted } from '../../lib/fastify-hooks/validate-token-not-blacklisted.js'
import responseDecorators from '../response-decorators/index.js'
import type { SyndicatorStore } from '../../lib/micropub/store/interface.js'
import type { Syndicator } from '../../lib/micropub/index.js'

import { defSyndicatePost } from './routes.js'
import { DEFAULT_INCLUDE_ERROR_DESCRIPTION, NAME } from './constants.js'

const PREFIX = `${NAME} `

export interface PluginOptions extends FastifyPluginOptions {
  includeErrorDescription: boolean
  me: string
  store: SyndicatorStore
  syndicators: { [uid: string]: Syndicator }
}

const defaults: Partial<PluginOptions> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION
}

const fastifySyndicator: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<PluginOptions>

  const {
    includeErrorDescription: include_error_description,
    me,
    store,
    syndicators
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

  const logIatAndExpClaims = defLogIatAndExpClaims({
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
  fastify.post(
    '/syndicate',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti
      ],
      preHandler: [validateAccessTokenNotBlacklisted]
      // schema: syndicator_post_request
    },
    defSyndicatePost({
      include_error_description,
      prefix: `${NAME}/routes `,
      store,
      syndicators
    })
  )

  done()
}

export default fp(fastifySyndicator, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
