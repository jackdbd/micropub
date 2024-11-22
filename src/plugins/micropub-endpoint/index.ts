import formbody from '@fastify/formbody'
import multipart from '@fastify/multipart'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import {
  defValidateAccessTokenNotBlacklisted,
  defValidateAccessTokenNotExpired,
  defValidateMeClaimInAccessToken,
  validateAuthorizationHeader
} from '../../lib/fastify-hooks/index.js'
import { NAME } from './constants.js'
import { defValidateGetRequest } from './hooks.js'
import {
  defAuthCallback,
  defEditor,
  defMicropubGet,
  defMicropubPost,
  defSubmit,
  postAccepted,
  postCreated
} from './routes.js'
import {
  micropub_get_request,
  micropub_post_request,
  plugin_options
} from './schemas.js'
import type { Store } from './store.js'
import type { SyndicateToItem } from './syndication.js'

declare module 'fastify' {
  interface FastifyReply {
    // https://micropub.spec.indieweb.org/#error-response
    micropubForbidden(error_description?: any): void
    micropubInsufficientScope(error_description?: any): void
    micropubInvalidRequest(error_description?: string): void
    micropubUnauthorized(error_description?: string): void
  }
}

export interface PluginOptions extends FastifyPluginOptions {
  authorizationCallbackRoute?: string

  baseUrl: string

  clientId: string

  codeChallengeMethod?: string

  codeVerifierLength?: number

  /**
   * URL of the user's website trying to authenticate using Web sign-in.
   *
   * See: https://indieweb.org/Web_sign-in
   */
  me: string

  mediaEndpoint: string

  micropubEndpoint: string

  /**
   * https://ajv.js.org/security.html#security-risks-of-trusted-schemas
   */
  reportAllAjvErrors?: boolean

  store: Store

  submitEndpoint: string

  /**
   * https://quill.p3k.io/docs/syndication
   */
  syndicateTo?: SyndicateToItem[]

  /**
   * Micropub clients will be able to obtain an access token from this endpoint
   * after you have granted authorization. The Micropub client will then use
   * this access token when making requests to your Micropub endpoint.
   *
   * See: https://indieweb.org/token-endpoint
   * See: https://tokens.indieauth.com/
   */
  tokenEndpoint: string
}

const default_options: Partial<PluginOptions> = {
  authorizationCallbackRoute: '/auth/callback',
  codeChallengeMethod: 'S256',
  codeVerifierLength: 128,
  reportAllAjvErrors: false,
  syndicateTo: []
}

const micropubEndpoint: FastifyPluginCallback<PluginOptions> = (
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

  fastify.decorateReply(
    'micropubInvalidRequest',
    function (error_description?: string) {
      // `this` refers to the current reply instance
      this.code(400).send({ error: 'invalid_request', error_description })
    }
  )

  fastify.decorateReply(
    'micropubUnauthorized',
    function (error_description?: string) {
      this.code(401).send({ error: 'unauthorized', error_description })
    }
  )

  fastify.decorateReply(
    'micropubForbidden',
    function (error_description?: string) {
      this.code(403).send({ error: 'forbidden', error_description })
    }
  )

  fastify.decorateReply(
    'micropubInsufficientScope',
    function (error_description?: string) {
      this.code(403).send({ error: 'insufficient_scope', error_description })
    }
  )

  const { reportAllAjvErrors: allErrors, store } = config

  // TODO: can I get an existing Ajv instance somehow? Should I?
  // Do NOT use allErrors in production
  // https://ajv.js.org/security.html#security-risks-of-trusted-schemas
  // We need these extra formats to fully support fluent-json-schema
  // https://github.com/ajv-validator/ajv-formats#formats
  const ajv = addFormats(new Ajv({ allErrors }), [
    'date',
    'date-time',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'json-pointer',
    'regex',
    'relative-json-pointer',
    'time',
    'uri',
    'uri-reference',
    'uri-template',
    'uuid'
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

  const {
    authorizationCallbackRoute: auth_callback,
    baseUrl: base_url,
    clientId: client_id,
    me,
    mediaEndpoint: media_endpoint,
    micropubEndpoint: micropub_endpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint: token_endpoint
  } = config

  const redirect_uri = `${base_url}${auth_callback}`

  const validateMeClaimInAccessToken = defValidateMeClaimInAccessToken({
    me,
    prefix: NAME
  })

  const validateAccessTokenNotExpired = defValidateAccessTokenNotExpired({
    prefix: NAME
  })

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({ prefix: NAME })

  fastify.get(
    auth_callback,
    defAuthCallback({ client_id, prefix: NAME, redirect_uri, token_endpoint })
  )
  fastify.log.debug(`${NAME} route registered: GET ${auth_callback}`)

  fastify.get('/editor', defEditor({ submit_endpoint: config.submitEndpoint }))
  fastify.log.debug(`${NAME} route registered: GET /editor`)

  const validateGetRequest = defValidateGetRequest({ ajv })

  const micropubGet = defMicropubGet({ media_endpoint, syndicate_to })
  fastify.get(
    '/micropub',
    { onRequest: [validateGetRequest], schema: micropub_get_request },
    micropubGet
  )
  fastify.log.debug(`${NAME} route registered: GET /micropub`)

  const micropubPost = defMicropubPost({
    ajv,
    me,
    media_endpoint,
    micropub_endpoint,
    store
  })
  fastify.post(
    '/micropub',
    {
      onRequest: [
        validateAuthorizationHeader,
        validateMeClaimInAccessToken,
        validateAccessTokenNotExpired,
        validateAccessTokenNotBlacklisted
      ],
      schema: micropub_post_request
    },
    micropubPost
  )
  fastify.log.debug(`${NAME} route registered: POST /micropub`)

  fastify.get('/accepted', postAccepted)
  fastify.log.debug(`${NAME} route registered: GET /accepted`)

  fastify.get('/created', postCreated)
  fastify.log.debug(`${NAME} route registered: GET /created`)

  fastify.post('/submit', defSubmit({ micropub_endpoint, prefix: NAME }))
  fastify.log.debug(`${NAME} route registered: POST /submit`)

  done()
}

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
