import { S3Client } from '@aws-sdk/client-s3'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { unixTimestamp } from '../../lib/date.js'
import {
  defDecodeJwtAndSetClaims,
  defLogIatAndExpClaims,
  defValidateClaim,
  defValidateScope,
  defValidateAccessTokenNotBlacklisted
} from '../../lib/fastify-hooks/index.js'
import { NAME, DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE } from './constants.js'
import { mediaErrorResponse } from './decorators/reply.js'
import { defMediaPost } from './routes.js'
// import { plugin_options, type MediaEndpointPluginOptions } from './schemas.js'
import { plugin_options } from './schemas.js'

export interface PluginOptions extends FastifyPluginOptions {
  baseUrl: string

  cloudflareAccountId: string
  cloudflareR2BucketName: string
  cloudflareR2AccessKeyId: string
  cloudflareR2SecretAccessKey: string

  /**
   * The Micropub server MAY include a human-readable description of the error
   * in the error_description property. This is meant to assist the Micropub
   * client developer in understanding the error. This is NOT meant to be shown
   * to the end user.
   *
   * @see https://micropub.spec.indieweb.org/#error-response
   */
  includeErrorDescription: boolean

  /**
   * URL of the user's website trying to authenticate using Web sign-in.
   *
   * See: https://indieweb.org/Web_sign-in
   */
  me: string

  multipartFormDataMaxFileSize: number

  /**
   * https://ajv.js.org/security.html#security-risks-of-trusted-schemas
   */
  reportAllAjvErrors?: boolean
}

const default_options: Partial<PluginOptions> = {
  multipartFormDataMaxFileSize: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: false
}

const mediaEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    default_options,
    options
  ) as Required<PluginOptions>
  // fastify.log.debug(config, `${NAME} configuration`)

  const ajv = addFormats(new Ajv({ allErrors: config.reportAllAjvErrors }), [
    'uri'
  ])

  const validatePluginOptions = ajv.compile(plugin_options)
  validatePluginOptions(config)

  if (validatePluginOptions.errors) {
    const details = validatePluginOptions.errors.map((err) => {
      return `${err.instancePath.slice(1)} ${err.message}`
    })
    throw new Error(
      `${NAME} plugin registered using invalid options: ${details.join('; ')}`
    )
  }
  fastify.log.debug(`${NAME} validated its configuration`)

  // Parse application/x-www-form-urlencoded requests
  // https://github.com/fastify/fastify-formbody/
  fastify.register(formbody)
  fastify.log.debug(`${NAME} registered Fastify plugin: formbody`)

  // Parse multipart/form-data requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: config.multipartFormDataMaxFileSize
    }
  })
  fastify.log.debug(`${NAME} registered Fastify plugin: multipart`)

  fastify.decorateReply('mediaErrorResponse', mediaErrorResponse)
  fastify.log.debug(`${NAME} decorateReply: mediaErrorResponse`)

  const {
    baseUrl: base_url,
    cloudflareAccountId: account_id,
    cloudflareR2AccessKeyId: accessKeyId,
    cloudflareR2BucketName: bucket_name,
    cloudflareR2SecretAccessKey: secretAccessKey,
    includeErrorDescription: include_error_description,
    me
  } = config

  const log_prefix = `${NAME}/hooks `

  const decodeJwtAndSetClaims = defDecodeJwtAndSetClaims({ log_prefix })

  const logIatAndExpClaims = defLogIatAndExpClaims({ log_prefix })

  const validateClaimMe = defValidateClaim(
    { claim: 'me', op: '==', value: me },
    { include_error_description, log_prefix }
  )

  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestamp
    },
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

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${account_id}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  })

  const mediaPost = defMediaPost({ base_url, bucket_name, s3 })

  fastify.post(
    '/media',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimMe,
        validateClaimExp,
        validateScopeMedia,
        validateAccessTokenNotBlacklisted
      ]
    },
    mediaPost
  )
  fastify.log.debug(`${NAME} route registered: POST /media`)

  done()
}

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
