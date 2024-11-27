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
  defValidateAccessTokenNotBlacklisted
} from '../../lib/fastify-hooks/index.js'
import type {
  BaseStoreError,
  BaseStoreValue,
  Store
} from '../../lib/micropub/index.js'
import {
  NAME,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'
import {
  defMicropubResponse,
  micropubErrorResponse,
  micropubDeleteSuccessResponse,
  micropubUndeleteSuccessResponse,
  micropubUpdateSuccessResponse
} from './decorators/reply.js'
import {
  hasScope,
  noActionSupportedResponse,
  noScopeResponse
} from './decorators/request.js'
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
  // type MicropubEndpointPluginOptions
} from './schemas.js'
import type { SyndicateToItem } from './syndication.js'
import { defValidateJf2 } from './validate-jf2.js'

export interface PluginOptions<
  StoreError extends BaseStoreError = BaseStoreError,
  StoreValue extends BaseStoreValue = BaseStoreValue
> extends FastifyPluginOptions {
  authorizationCallbackRoute?: string

  baseUrl: string

  clientId: string

  codeChallengeMethod?: string

  codeVerifierLength?: number

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
   * @see https://indieweb.org/Web_sign-in
   */
  me: string

  mediaEndpoint: string

  micropubEndpoint: string

  multipartFormDataMaxFileSize: number

  /**
   * @see https://ajv.js.org/security.html#security-risks-of-trusted-schemas
   */
  reportAllAjvErrors?: boolean

  store: Store<StoreError, StoreValue>

  submitEndpoint: string

  /**
   * @see https://quill.p3k.io/docs/syndication
   */
  syndicateTo?: SyndicateToItem[]

  /**
   * Micropub clients will be able to obtain an access token from this endpoint
   * after you have granted authorization. The Micropub client will then use
   * this access token when making requests to your Micropub endpoint.
   *
   * @see https://indieweb.org/token-endpoint
   * @see https://tokens.indieauth.com/
   */
  tokenEndpoint: string
}

const default_options = {
  authorizationCallbackRoute: DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  codeChallengeMethod: DEFAULT_CODE_CHALLENGE_METHOD,
  codeVerifierLength: DEFAULT_CODE_VERIFIER_LENGTH,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  multipartFormDataMaxFileSize: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS,
  syndicateTo: [] as SyndicateToItem[]
}

type Options = PluginOptions<BaseStoreError, BaseStoreValue>

const micropubEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(default_options, options) as Required<Options>
  // fastify.log.debug(config, `${NAME} configuration`)

  const {
    authorizationCallbackRoute: auth_callback,
    baseUrl: base_url,
    clientId: client_id,
    includeErrorDescription: include_error_description,
    me,
    mediaEndpoint: media_endpoint,
    micropubEndpoint: micropub_endpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors: allErrors,
    store,
    submitEndpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint: token_endpoint
  } = config

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

  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${NAME} registered Fastify plugin: formbody`)

  // Parse multipart/form-data requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: multipartFormDataMaxFileSize
    }
  })
  fastify.log.debug(`${NAME} registered Fastify plugin: multipart`)

  // === BEGIN apply decorators ============================================= //
  fastify.decorateReply('micropubErrorResponse', micropubErrorResponse)
  fastify.log.debug(`${NAME} decorateReply: micropubErrorResponse`)

  fastify.decorateReply(
    'micropubDeleteSuccessResponse',
    micropubDeleteSuccessResponse
  )
  fastify.log.debug(`${NAME} decorateReply: micropubDeleteSuccessResponse`)

  fastify.decorateReply(
    'micropubUndeleteSuccessResponse',
    micropubUndeleteSuccessResponse
  )
  fastify.log.debug(`${NAME} decorateReply: micropubUndeleteSuccessResponse`)

  fastify.decorateReply(
    'micropubUpdateSuccessResponse',
    micropubUpdateSuccessResponse
  )
  fastify.log.debug(`${NAME} decorateReply: micropubUpdateSuccessResponse`)

  fastify.decorateRequest('hasScope', hasScope)
  fastify.log.debug(`${NAME} decorateRequest: hasScope`)

  fastify.decorateRequest(
    'noActionSupportedResponse',
    noActionSupportedResponse
  )
  fastify.log.debug(`${NAME} decorateRequest: noActionSupportedResponse`)

  fastify.decorateRequest('noScopeResponse', noScopeResponse)
  fastify.log.debug(`${NAME} decorateRequest: noScopeResponse`)

  const { validateCard, validateCite, validateEvent, validateEntry } =
    defValidateJf2(ajv)

  const micropubResponseCard = defMicropubResponse({
    include_error_description,
    validate: validateCard,
    store
  })

  const micropubResponseCite = defMicropubResponse({
    include_error_description,
    validate: validateCite,
    store
  })

  const micropubResponseEvent = defMicropubResponse({
    include_error_description,
    validate: validateEvent,
    store
  })

  const micropubResponseEntry = defMicropubResponse({
    include_error_description,
    validate: validateEntry,
    store
  })

  const dependencies = ['micropubErrorResponse']

  fastify.decorateReply(
    'micropubResponseCard',
    micropubResponseCard,
    dependencies
  )
  fastify.log.debug(`${NAME} decorateReply: micropubResponseCard`)

  fastify.decorateReply(
    'micropubResponseCite',
    micropubResponseCite,
    dependencies
  )
  fastify.log.debug(`${NAME} decorateReply: micropubResponseCite`)

  fastify.decorateReply(
    'micropubResponseEvent',
    micropubResponseEvent,
    dependencies
  )
  fastify.log.debug(`${NAME} decorateReply: micropubResponseEvent`)

  fastify.decorateReply(
    'micropubResponseEntry',
    micropubResponseEntry,
    dependencies
  )
  fastify.log.debug(`${NAME} decorateReply: micropubResponseEntry`)
  // === END apply decorators =============================================== //

  const redirect_uri = `${base_url}${auth_callback}`

  // === BEGIN define hooks ================================================= //
  const log_prefix = `${NAME}/hooks `

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
      value: unixTimestamp
    },
    { include_error_description, log_prefix }
  )

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      log_prefix
    })

  const validateGetRequest = defValidateGetRequest({ ajv })

  // === END define hooks =================================================== //

  fastify.get(
    auth_callback,
    defAuthCallback({
      client_id,
      include_error_description,
      prefix: `${NAME} `,
      redirect_uri,
      token_endpoint
    })
  )
  fastify.log.debug(`${NAME} route registered: GET ${auth_callback}`)

  fastify.get('/editor', defEditor({ submit_endpoint: submitEndpoint }))
  fastify.log.debug(`${NAME} route registered: GET /editor`)

  const micropubGet = defMicropubGet({ media_endpoint, syndicate_to })
  fastify.get(
    '/micropub',
    { onRequest: [validateGetRequest], schema: micropub_get_request },
    micropubGet
  )
  fastify.log.debug(`${NAME} route registered: GET /micropub`)

  const micropubPost = defMicropubPost({
    ajv,
    include_error_description,
    me,
    media_endpoint,
    micropub_endpoint,
    store
  })
  fastify.post(
    '/micropub',
    {
      onRequest: [
        decodeJwtAndSetClaims,
        logIatAndExpClaims,
        validateClaimMe,
        validateClaimExp,
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

  fastify.post('/submit', defSubmit({ micropub_endpoint, prefix: `${NAME} ` }))
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
