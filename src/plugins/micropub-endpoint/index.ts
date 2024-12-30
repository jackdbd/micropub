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
  defValidateAccessTokenNotBlacklisted
} from '../../lib/fastify-hooks/index.js'
import type { SyndicateToItem } from '../../lib/micropub/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { DEFAULT, NAME } from './constants.js'
import { defMicropubResponse } from './decorators/reply.js'
import { defValidateGetRequest } from './hooks.js'
import { defMicropubGet } from './routes/micropub-get.js'
import { defMicropubPost } from './routes/micropub-post.js'
import {
  micropub_get_request,
  micropub_post_request
} from './routes/schemas.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  multipartFormDataMaxFileSize: DEFAULT.MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS,
  syndicateTo: [] as SyndicateToItem[]
}

const micropubEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    create,
    delete: deleteContent,
    includeErrorDescription: include_error_description,
    isAccessTokenBlacklisted,
    logPrefix: log_prefix,
    me,
    mediaEndpoint: media_endpoint,
    micropubEndpoint: micropub_endpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors: report_all_ajv_errors,
    syndicateTo: syndicate_to,
    undelete,
    update
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'date',
      'date-time',
      'duration',
      'email',
      'uri'
    ])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${log_prefix}registered plugin: formbody`)

  // Parse multipart/form-data requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: multipartFormDataMaxFileSize
    }
  })
  fastify.log.debug(`${log_prefix}registered plugin: multipart`)

  // === DECORATORS ========================================================= //
  const micropubResponse = defMicropubResponse({
    create,
    include_error_description,
    prefix: log_prefix
  })

  fastify.decorateReply('micropubResponse', micropubResponse)
  fastify.log.debug(
    `${log_prefix}decorated fastify.reply with micropubResponse`
  )

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

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ ajv, isAccessTokenBlacklisted })

  const validateGetRequest = defValidateGetRequest({ ajv })

  // === ROUTES ============================================================= //
  fastify.get(
    '/micropub',
    { preHandler: [validateGetRequest], schema: micropub_get_request },
    defMicropubGet({ media_endpoint, syndicate_to })
  )

  fastify.post(
    '/micropub',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimExp,
        validateClaimMe,
        validateClaimJti,
        validateAccessTokenNotBlacklisted
      ],
      schema: micropub_post_request
    },
    defMicropubPost({
      ajv,
      delete: deleteContent,
      include_error_description,
      log_prefix,
      me,
      media_endpoint,
      micropub_endpoint,
      undelete,
      update
    })
  )

  done()
}

// TODO: improve this docstring. Also, find a way to generate documentation from
// JSON schema. Like this Python library:
// https://github.com/coveooss/json-schema-for-humans

/**
 * The Micropub server MAY include a human-readable description of the error in
 * the `error_description` property. This is meant to assist the Micropub client
 * developer in understanding the error. This is NOT meant to be shown to the
 * end user.
 *
 * URL of the user's website trying to authenticate using Web sign-in.
 * @see https://indieweb.org/Web_sign-in
 *
 * @see https://ajv.js.org/security.html#security-risks-of-trusted-schemas
 *
 * @see https://quill.p3k.io/docs/syndication
 *
 * Micropub clients will be able to obtain an access token from this endpoint
 * after you have granted authorization. The Micropub client will then use this
 * access token when making requests to your Micropub endpoint.
 *
 * @see https://indieweb.org/token-endpoint
 * @see https://tokens.indieauth.com/
 * @see https://micropub.spec.indieweb.org/#error-response
 */
export default fp(micropubEndpoint, {
  fastify: '5.x',
  name: NAME,
  // By default, fastify-plugin breaks the plugin encapsulation. We need to keep
  // the plugin encapsulated because Fastify can have only one parser for each
  // Content type. Removing the encapsulation would mean that if another plugin
  // tried to use @fastify/formbody or @fastify/multipart, the Fastify app would
  // fail to start.
  encapsulate: true
})
