import formbody from '@fastify/formbody'
import responseValidation from '@fastify/response-validation'
// import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { applyToDefaults } from '@hapi/hoek'
import { Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { error_response } from '@jackdbd/oauth2'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import { DEFAULT, NAME } from './constants.js'
import { defAuthorizePage } from './routes/authorize-page.js'
import { defAuthorizePost } from './routes/authorize-post.js'
import { defHandleAction } from './routes/handle-action.js'
import {
  access_token_request_body,
  authorization_request_querystring,
  authorization_response_body_success,
  handle_action_querystring,
  options as options_schema,
  type Options,
  profile_url_request_body,
  profile_url_response_body_success
} from './schemas.js'

export {
  access_token_request_body,
  type AccessTokenRequestBody,
  authorization_response_body_success,
  type AuthorizationResponseBodySuccess,
  authorization_response_querystring,
  type AuthorizationResponseQuerystring,
  profile_url_request_body,
  type ProfileUrlRequestBody,
  profile_url_response_body_success,
  type ProfileUrlResponseBodySuccess
} from './schemas.js'

const defaults: Partial<Options> = {
  authorizationCodeExpiration: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  logPrefix: DEFAULT.LOG_PREFIX,
  redirectPathOnSubmit: DEFAULT.REDIRECT_PATH_ON_SUBMIT,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const authorizationEndpoint: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    authorizationCodeExpiration: authorization_code_expiration,
    includeErrorDescription: include_error_description,
    issuer,
    logPrefix: log_prefix,
    onAuthorizationCodeVerified,
    onUserApprovedRequest,
    redirectPathOnSubmit: redirect_path_on_submit,
    reportAllAjvErrors: report_all_ajv_errors,
    retrieveAuthorizationCode
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  throwWhenNotConform(
    { ajv, schema: options_schema, data: config },
    { basePath: 'authorization-endpoint options' }
  )

  // const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>()

  // === PLUGINS ============================================================ //
  // Parse application/x-www-form-urlencoded requests
  fastify.register(formbody)
  fastify.log.debug(`${log_prefix}registered plugin: formbody`)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(responseValidation)
    fastify.log.debug(`${log_prefix}registered plugin: response-validation`)
  }

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  fastify.get(
    '/auth',
    {
      schema: {
        querystring: authorization_request_querystring,
        response: {
          '4xx': error_response,
          '5xx': error_response
        }
      }
    },
    defAuthorizePage({
      authorization_code_expiration,
      include_error_description,
      log_prefix,
      redirect_path_on_submit
    })
  )

  fastify.post(
    '/auth',
    {
      onError: (_request, _reply, error, done) => {
        console.log('=== exception in /auth handler or hooks ===', error)
        // process.exit(1)
        done()
      },
      schema: {
        body: Type.Union([access_token_request_body, profile_url_request_body]),
        response: {
          200: Type.Union([
            authorization_response_body_success,
            profile_url_response_body_success
          ]),
          '4xx': error_response,
          '5xx': error_response
        }
      }
    },
    defAuthorizePost({
      include_error_description,
      log_prefix,
      onAuthorizationCodeVerified,
      retrieveAuthorizationCode
    })
  )

  fastify.get(
    redirect_path_on_submit,
    // TODO: redirect if not authenticated with ANY one of the authentication
    // providers (e.g. GitHub via RelMeAuth). For example, we need a valid
    // GitHub access token to be considered authenticated with GitHub; we do NOT
    // need a valid access token from the IndieAuth authorization server.
    // Before issuing an authorization code, the authorization server MUST first
    // verify the identity of the resource owner.
    {
      // onRequest: [redirectWhenNotAuthenticated],
      schema: {
        querystring: handle_action_querystring,
        response: {
          '4xx': error_response,
          '5xx': error_response
        }
      }
    },
    defHandleAction({
      authorization_code_expiration,
      include_error_description,
      issuer,
      log_prefix,
      onUserApprovedRequest
    })
  )

  done()
}

export default fp(authorizationEndpoint, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
