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
import { throwIfDoesNotConform } from '../../lib/validators.js'
import responseDecorators from '../response-decorators/index.js'
import { DEFAULT, NAME } from './constants.js'
import { defMediaGet } from './routes/media-get.js'
import { defMediaPost } from './routes/media-post.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  logPrefix: DEFAULT.LOG_PREFIX,
  multipartFormDataMaxFileSize: DEFAULT.MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const mediaEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    delete: deleteMedia,
    isBlacklisted,
    logPrefix: log_prefix,
    me,
    multipartFormDataMaxFileSize: fileSize,
    reportAllAjvErrors: report_all_ajv_errors,
    upload
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${log_prefix}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  fastify.register(multipart, { limits: { fileSize } })
  fastify.log.debug(
    `${log_prefix}registered plugin: multipart (for parsing multipart/form-data)`
  )

  fastify.register(responseDecorators)
  fastify.log.debug(`${log_prefix} registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({ ajv })

  const logIatAndExpClaims = defLogIatAndExpClaims({ ajv })

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

  const validateScopeMedia = defValidateScope({ ajv, scope: 'media' })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ ajv, isBlacklisted })

  // === ROUTES ============================================================= //
  fastify.get('/media', defMediaGet({ delete: deleteMedia }))

  fastify.post(
    '/media',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateScopeMedia,
        validateAccessTokenNotBlacklisted
      ]
    },
    defMediaPost({ delete: deleteMedia, upload })
  )

  done()
}

/**
 * Plugin that adds a media endpoint to a Fastify server.
 *
 * @see [Micropub Media Endpoint](https://www.w3.org/TR/micropub/#media-endpoint)
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
