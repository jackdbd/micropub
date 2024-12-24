import formbody from '@fastify/formbody'
// import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { defIssueCode } from '../../lib/authorization-code-storage-interface/issue-code.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'

import { DEFAULT, NAME } from './constants.js'
import { defConfigGet } from './routes/authorization-config-get.js'
import { defAuthGet } from './routes/authorization-get.js'
import { defAuthPost } from './routes/authorization-post.js'
import {
  auth_get_request_querystring,
  auth_post_request_body,
  auth_post_response_body_success
} from './routes/schemas.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const authorizationEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const { logPrefix: log_prefix, reportAllAjvErrors: report_all_ajv_errors } =
    config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  const {
    accessTokenExpiration: access_token_expiration,
    addToIssuedCodes,
    authorizationCodeExpiration: authorization_code_expiration,
    issuer,
    markAuthorizationCodeAsUsed,
    refreshTokenExpiration: refresh_token_expiration
  } = config

  // const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>()

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${log_prefix}registered plugin: formbody`)

  fastify.register(responseDecorators)
  fastify.log.debug(`${log_prefix}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  const issueCode = defIssueCode({ addToIssuedCodes })

  fastify.get('/auth/config', defConfigGet(config))

  fastify.get(
    '/auth',
    {
      schema: {
        querystring: auth_get_request_querystring
      }
    },
    defAuthGet({
      access_token_expiration,
      authorization_code_expiration,
      issuer,
      issueCode,
      log_prefix,
      refresh_token_expiration
    })
  )

  // TODO: implement verifyCode

  fastify.post(
    '/auth',
    {
      schema: {
        body: auth_post_request_body,
        response: { '2xx': auth_post_response_body_success }
      }
    },
    defAuthPost({
      log_prefix,
      markAuthorizationCodeAsUsed
    })
  )

  done()
}

export default fp(authorizationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
