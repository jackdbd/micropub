import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { unixTimestampInSeconds } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defLogIatAndExpClaims,
  defValidateClaim,
  defValidateScope,
  defValidateAccessTokenNotBlacklisted
} from '../../lib/fastify-hooks/index.js'
import { validationErrors } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'
import {
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  NAME
} from './constants.js'
import { defMediaGet } from './routes/media-get.js'
import { defMediaPost } from './routes/media-post.js'
import { options as options_schema, type Options } from './schemas.js'

const PREFIX = `${NAME} `

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  multipartFormDataMaxFileSize: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS
}

const mediaEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    includeErrorDescription: include_error_description,
    me,
    multipartFormDataMaxFileSize: fileSize,
    reportAllAjvErrors: allErrors,
    store
  } = config

  const ajv = addFormats(new Ajv({ allErrors }), ['uri'])

  const errors = validationErrors(ajv, options_schema, config)
  if (errors.length > 0) {
    throw new Error(
      `${PREFIX}plugin registered using invalid options: ${errors.join('; ')}`
    )
  }

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${PREFIX}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  fastify.register(multipart, { limits: { fileSize } })
  fastify.log.debug(
    `${PREFIX}registered plugin: multipart (for parsing multipart/form-data)`
  )

  fastify.register(responseDecorators)
  fastify.log.debug(`${NAME} registered plugin: responseDecorators`)

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

  const validateScopeMedia = defValidateScope({
    scope: 'media',
    include_error_description,
    log_prefix
  })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      log_prefix
    })

  // === ROUTES ============================================================= //
  fastify.get('/media', defMediaGet({ store }))

  fastify.post(
    '/media',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateScopeMedia
      ],
      preHandler: [validateAccessTokenNotBlacklisted]
    },
    defMediaPost({ store, include_error_description })
  )

  done()
}

/**
 * Adds a Media Endpoint to a Micropub server.
 *
 * @see https://www.w3.org/TR/micropub/#media-endpoint
 */
export default fp(mediaEndpoint, {
  fastify: '5.x',
  name: NAME,
  // By default, fastify-plugin breaks the plugin encapsulation. We need to keep
  // the plugin encapsulated because Fastify can have only one parser for each
  // Content type. Removing the encapsulation would mean that if another plugin
  // tried to use @fastify/formbody or @fastify/multipart, the Fastify app would
  // fail to start.
  encapsulate: true
})
