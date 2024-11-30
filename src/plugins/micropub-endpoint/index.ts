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
import { validationErrors } from '../../lib/validators.js'

import responseDecorators from '../response-decorators/index.js'

import {
  NAME,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'
import { defMicropubResponse } from './decorators/reply.js'
import {
  noActionSupportedResponse,
  noScopeResponse
} from './decorators/request.js'
import { defValidateGetRequest } from './hooks.js'
import { postAccepted } from './routes/accepted-get.js'
import { defAuthCallback } from './routes/auth-callback.js'
import { postCreated } from './routes/created-get.js'
import { defEditor } from './routes/editor-get.js'
import { defMicropubGet } from './routes/micropub-get.js'
import { defMicropubPost } from './routes/micropub-post.js'
import { defSubmit } from './routes/submit-post.js'
import {
  micropub_get_request,
  micropub_post_request,
  options as options_schema,
  type Options
} from './schemas.js'
import type { SyndicateToItem } from './syndication.js'

const defaults: Partial<Options> = {
  authorizationCallbackRoute: DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  codeChallengeMethod: DEFAULT_CODE_CHALLENGE_METHOD,
  codeVerifierLength: DEFAULT_CODE_VERIFIER_LENGTH,
  includeErrorDescription: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  multipartFormDataMaxFileSize: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  reportAllAjvErrors: DEFAULT_REPORT_ALL_AJV_ERRORS,
  syndicateTo: [] as SyndicateToItem[]
}

const micropubEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

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
    'duration',
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

  const errors = validationErrors(ajv, options_schema, config)
  if (errors.length > 0) {
    throw new Error(
      `${NAME} plugin registered using invalid options: ${errors.join('; ')}`
    )
  }

  // === PLUGINS ============================================================ //
  const prefix_plugins = `${NAME}/plugins `

  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${prefix_plugins}registered Fastify plugin: formbody`)

  // Parse multipart/form-data requests
  // https://github.com/fastify/fastify-multipart
  fastify.register(multipart, {
    limits: {
      fileSize: multipartFormDataMaxFileSize
    }
  })
  fastify.log.debug(`${prefix_plugins}registered plugin: multipart`)

  fastify.register(responseDecorators)
  fastify.log.debug(`${prefix_plugins}registered plugin: responseDecorators`)

  // === DECORATORS ========================================================= //
  const prefix_decorators = `${NAME}/decorators `

  fastify.decorateRequest(
    'noActionSupportedResponse',
    noActionSupportedResponse
  )
  fastify.log.debug(
    `${prefix_decorators}decorateRequest: noActionSupportedResponse`
  )

  fastify.decorateRequest('noScopeResponse', noScopeResponse)
  fastify.log.debug(`${prefix_decorators}decorateRequest: noScopeResponse`)

  const micropubResponse = defMicropubResponse({
    include_error_description,
    prefix: `${NAME}/decorators/micropub-response `,
    store
  })

  const dependencies = ['errorResponse']
  fastify.decorateReply('micropubResponse', micropubResponse, dependencies)
  fastify.log.debug(`${prefix_decorators}decorateReply: micropubResponse`)

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

  const validateAccessTokenNotBlacklisted =
    defValidateAccessTokenNotBlacklisted({
      include_error_description,
      log_prefix
    })

  const validateGetRequest = defValidateGetRequest({
    ajv,
    include_error_description
  })

  // === ROUTES ============================================================= //
  fastify.get(
    auth_callback,
    defAuthCallback({
      client_id,
      include_error_description,
      prefix: `${NAME}/routes `,
      redirect_uri: `${base_url}${auth_callback}`,
      token_endpoint
    })
  )

  fastify.get(
    '/editor',
    defEditor({ prefix: `${NAME}/routes `, submit_endpoint: submitEndpoint })
  )

  fastify.get(
    '/micropub',
    { onRequest: [validateGetRequest], schema: micropub_get_request },
    defMicropubGet({ media_endpoint, syndicate_to })
  )

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
    defMicropubPost({
      ajv,
      include_error_description,
      me,
      media_endpoint,
      micropub_endpoint,
      prefix: `${NAME}/routes `,
      store
    })
  )

  fastify.get('/accepted', postAccepted)

  fastify.get('/created', postCreated)

  fastify.post(
    '/submit',
    defSubmit({ micropub_endpoint, prefix: `${NAME}/routes ` })
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
