import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { applyToDefaults } from '@hapi/hoek'
import { NAME } from './constants.js'
import {
  defValidateAccessToken,
  defValidateGetRequest,
  // validateAccessTokenNotExpired,
  validateAccessTokenNotBlacklisted
} from './hooks.js'
import {
  defAuthCallback,
  defEditor,
  defMicropubGet,
  defMicropubPost,
  defSubmit,
  postAccepted,
  postCreated
} from './routes.js'
import type { SyndicateToItem } from './routes.js'
import {
  micropub_get_request,
  micropub_post_request,
  plugin_options
} from './schemas.js'

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

const defaultOptions: Partial<PluginOptions> = {
  authorizationCallbackRoute: '/auth/callback',
  codeChallengeMethod: 'S256',
  codeVerifierLength: 128,
  reportAllAjvErrors: false,
  syndicateTo: []
}

const fastifyMicropub: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  const { reportAllAjvErrors: allErrors } = config

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

  const validateAccessToken = defValidateAccessToken({ base_url, me })

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

  // To upload files, the Micropub client MUST check for the presence of a Media
  // Endpoint. If there is no Media Endpoint, the client can assume that the
  // Micropub endpoint accepts files directly, and can send the request to it
  // directly. To upload a file to the Micropub endpoint, format the whole
  // request as multipart/form-data and send the file(s) as a standard property.
  // https://micropub.spec.indieweb.org/#uploading-files

  const micropubPost = defMicropubPost({ ajv, base_url })
  fastify.post(
    '/micropub',
    {
      onRequest: [
        validateAccessToken,
        // validateAccessTokenNotExpired,
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

/**
 * https://indieweb.org/Micropub#Handling_a_micropub_request
 */
export default fp(fastifyMicropub, {
  fastify: '5.x',
  name: NAME
})
