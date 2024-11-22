import { S3Client } from '@aws-sdk/client-s3'
import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import {
  defValidateAccessTokenNotBlacklisted,
  defValidateAccessTokenNotExpired,
  defValidateScopeInAccessToken,
  defValidateMeClaimInAccessToken,
  validateAuthorizationHeader
} from '../../lib/fastify-hooks/index.js'
import { NAME } from './constants.js'
import { defMediaPost } from './routes.js'

export interface PluginOptions extends FastifyPluginOptions {
  baseUrl: string

  cloudflareAccountId: string
  cloudflareR2BucketName: string
  cloudflareR2AccessKeyId: string
  cloudflareR2SecretAccessKey: string

  /**
   * URL of the user's website trying to authenticate using Web sign-in.
   *
   * See: https://indieweb.org/Web_sign-in
   */
  me: string
}

const default_options: Partial<PluginOptions> = {}

const mediaEndpoint: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    default_options,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  // Parse application/x-www-form-urlencoded requests
  // https://github.com/fastify/fastify-formbody/
  fastify.register(formbody)

  // Parse multipart/form-data requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: 10_000_000 // in bytes
    }
  })
  fastify.log.debug(`${NAME} registered Fastify plugins: formbody, multipart`)

  const {
    baseUrl: base_url,
    cloudflareAccountId: account_id,
    cloudflareR2AccessKeyId: accessKeyId,
    cloudflareR2BucketName: bucket_name,
    cloudflareR2SecretAccessKey: secretAccessKey,
    me
  } = config

  const validateMeClaimInAccessToken = defValidateMeClaimInAccessToken({
    me,
    prefix: NAME
  })

  const validateMediaScopeInAccessToken = defValidateScopeInAccessToken({
    prefix: NAME,
    scope: 'media'
  })

  const validateAccessTokenNotExpired = defValidateAccessTokenNotExpired({
    prefix: NAME
  })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ prefix: NAME })

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
        validateAuthorizationHeader,
        validateMeClaimInAccessToken,
        validateMediaScopeInAccessToken,
        validateAccessTokenNotExpired,
        validateAccessTokenNotBlacklisted
      ]
    },
    mediaPost
  )
  fastify.log.debug(`${NAME} route registered: POST /media ======`)

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
