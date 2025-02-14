import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import type { OAuth2Namespace } from '@fastify/oauth2'
import fastifyRequestContext from '@fastify/request-context'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import view from '@fastify/view'
import sensible from '@fastify/sensible'
import type { OnIssuedTokens } from '@jackdbd/indieauth/schemas/user-provided-functions'
import auth from '@jackdbd/fastify-authorization-endpoint'
import type { PluginOptions as AuthorizationEndpointPluginOptions } from '@jackdbd/fastify-authorization-endpoint'
import introspection from '@jackdbd/fastify-introspection-endpoint'
import media from '@jackdbd/fastify-media-endpoint'
import type { PluginOptions as MediaEndpointPluginOptions } from '@jackdbd/fastify-media-endpoint'
import micropub from '@jackdbd/fastify-micropub-endpoint'
// import micropub from './plugins/micropub-endpoint/index.js'
import type { PluginOptions as MicropubEndpointPluginOptions } from '@jackdbd/fastify-micropub-endpoint'
import revocation from '@jackdbd/fastify-revocation-endpoint'
import syndicate from '@jackdbd/fastify-syndicate-endpoint'
import token from '@jackdbd/fastify-token-endpoint'
import type { PluginOptions as TokenEndpointPluginOptions } from '@jackdbd/fastify-token-endpoint'
import userinfo from '@jackdbd/fastify-userinfo-endpoint'
import type { PluginOptions as UserinfoEndpointPluginOptions } from '@jackdbd/fastify-userinfo-endpoint'
import { defDefaultPublication, defGitHub } from '@jackdbd/github-content-store'
import { secondsToUTCString, type AccessTokenClaims } from '@jackdbd/indieauth'
import { code_challenge, code_challenge_method } from '@jackdbd/pkce'
import { defR2 } from '@jackdbd/r2-media-store'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'

import { defStorage } from './lib/storage-implementations/index.js'
import { defSyndicator } from './lib/telegram-syndicator/index.js'

import micropubClient, {
  type BaseErrorResponseBody,
  type BaseSuccessResponseBody
} from './plugins/micropub-client/index.js'
import renderConfig from './plugins/render-config/index.js'
import { successResponse } from './plugins/micropub-client/decorators/index.js'

import { defAjv } from './ajv.js'
import type { Config } from './config.js'
import {
  defErrorHandlerDev,
  defErrorHandlerProd
} from './error-handlers/index.js'
import { defNotFoundHandler } from './not-found-handlers/index.js'
import { tap } from './nunjucks/filters.js'
import * as nunjucks_globals from './nunjucks/globals.js'
import { defSQLiteUtils } from './sqlite-utils.js'
import {
  defIsAccessTokenRevoked,
  defOnAuthorizationCodeVerified,
  defOnIssuedTokens,
  defOnUserApprovedRequest,
  defRetrieveAccessToken,
  defRetrieveAuthorizationCode,
  defRetrieveRefreshToken,
  defRetrieveUserProfile,
  defRevokeAccessToken,
  defRevokeRefreshToken
} from './storage-handlers/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webc_components = path.join(__dirname, 'components')

const LOG_PREFIX = `[app] `

declare module 'fastify' {
  interface FastifyInstance {
    githubOAuth2: OAuth2Namespace
  }

  interface FastifyReply {
    errorResponse<B extends BaseErrorResponseBody = BaseErrorResponseBody>(
      code: number,
      body: B
    ): void

    successResponse<
      B extends BaseSuccessResponseBody = BaseSuccessResponseBody
    >(
      code: number,
      body: B
    ): void

    render(template: string, data: Record<string, any>): Promise<void>
  }
}

// https://github.com/fastify/fastify-secure-session?tab=readme-ov-file#add-typescript-types
declare module '@fastify/secure-session' {
  interface SessionData {
    access_token: string
    claims: AccessTokenClaims
    code_challenge: string
    code_challenge_methods_supported: string[]
    code_verifier: string
    introspection_endpoint: string
    issuer: string
    me: string
    refresh_token: string
    scope: string
    state: string
    revocation_endpoint: string
    token_endpoint: string
    userinfo_endpoint: string
  }
}

/**
 * Instantiates the Fastify app.
 */
export async function defFastify(config: Config) {
  const {
    access_token_expiration,
    authorization_code_expiration: authorizationCodeExpiration,
    authorization_endpoint: authorizationEndpoint,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_oauth_client_id: githubOAuthClientId,
    github_oauth_client_secret: githubOAuthClientSecret,
    github_auth_start_path: githubAuthStartPath,
    github_auth_redirect_path: githubAuthRedirectPath,
    github_owner,
    github_repo,
    github_token,
    include_error_description: includeErrorDescription,
    indieauth_client_id,
    indieauth_client_logo_uri,
    indieauth_client_name,
    indieauth_client_redirect_uris,
    indieauth_client_uri,
    introspection_endpoint: introspectionEndpoint,
    issuer,
    jwks,
    jwks_url,
    log_level,
    me,
    media_endpoint: mediaEndpoint,
    media_public_base_url,
    micropub_endpoint: micropubEndpoint,
    multipart_form_data_max_file_size: multipartFormDataMaxFileSize,
    refresh_token_expiration,
    report_all_ajv_errors: reportAllAjvErrors,
    revocation_endpoint: revocationEndpoint,
    secure_session_expiration,
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    should_media_endpoint_ignore_filename,
    soft_delete,
    submit_endpoint: submitEndpoint,
    syndicate_to,
    telegram_chat_id,
    telegram_token,
    token_endpoint: tokenEndpoint,
    use_development_error_handler,
    use_secure_flag_for_session_cookie,
    userinfo_endpoint: userinfoEndpoint,
    NODE_ENV
  } = config

  // console.log(`=== app config ===`)
  // console.log(config)

  const fastify = Fastify({
    logger: {
      // https://getpino.io/#/docs/help?id=level-string
      formatters: {
        level: (label) => {
          return {
            level: label
          }
        }
      },
      level: log_level
    }
  })

  // The function conformResult in @jackdbd/schema-validators cannot deal with
  // schemas that have one or more $ref (or probably it cannot deal only with
  // filesystem $refs). So we need to dereference those $refs by compiling the
  // schemas. We can do it now, when we instantiate Ajv, or later (but before
  // calling conformResult), using ajv.addSchema.
  // Probably I could use a library like this one to dereference all $ref in one
  // go: https://github.com/APIDevTools/json-schema-ref-parser
  const ajv = defAjv({
    allErrors: reportAllAjvErrors,
    schemas: [code_challenge]
  })
  ajv.addSchema(code_challenge_method)

  const backend = 'sqlite'
  const environment = NODE_ENV === 'production' ? 'prod' : 'dev'

  const { error: storage_error, value: storage } = defStorage({
    ajv,
    backend,
    env: environment
  })

  if (storage_error) {
    throw storage_error
  }

  fastify.log.debug(
    `${LOG_PREFIX}storage backend ${backend} [${environment}] initialized`
  )

  const authorization_code_log = {
    debug: (message: string) => {
      fastify.log.debug(`[app/authorization-code-storage] ${message}`)
    },
    error: (message: string) => {
      fastify.log.error(`[app/authorization-code-storage] ${message}`)
    }
  }

  const token_log = {
    debug: (message: string) => {
      fastify.log.debug(`[app/token-storage] ${message}`)
    },
    error: (message: string) => {
      fastify.log.error(`[app/token-storage] ${message}`)
    }
  }

  let onIssuedTokens: OnIssuedTokens
  if (backend === 'sqlite') {
    const { batchTransaction } = defSQLiteUtils({ env: environment })
    onIssuedTokens = defOnIssuedTokens({ log: token_log, batchTransaction })
  } else {
    onIssuedTokens = defOnIssuedTokens({ log: token_log, storage })
  }

  const retrieveUserProfile = defRetrieveUserProfile({
    storage: storage.user_profile
  })

  const onAuthorizationCodeVerified = defOnAuthorizationCodeVerified({
    log: authorization_code_log,
    storage: storage.authorization_code
  })

  const onUserApprovedRequest = defOnUserApprovedRequest({
    log: authorization_code_log,
    storage: storage.authorization_code
  })

  const retrieveAuthorizationCode = defRetrieveAuthorizationCode({
    log: authorization_code_log,
    storage: storage.authorization_code
  })

  const isAccessTokenRevoked = defIsAccessTokenRevoked({
    log: token_log,
    storage: storage.access_token
  })

  const retrieveAccessToken = defRetrieveAccessToken({
    storage: storage.access_token
  })

  const retrieveRefreshToken = defRetrieveRefreshToken({
    storage: storage.refresh_token
  })

  const revokeAccessToken = defRevokeAccessToken({
    log: token_log,
    storage: storage.access_token
  })

  const revokeRefreshToken = defRevokeRefreshToken({
    log: token_log,
    storage: storage.refresh_token
  })

  // === PLUGINS ============================================================ //
  fastify.register(fastifyRequestContext)
  fastify.log.debug(`${LOG_PREFIX}registered plugin: @fastify/request-context`)

  const sessionName = 'session'

  const cookie = {
    path: '/',
    httpOnly: true,
    maxAge: secure_session_expiration,
    secure: use_secure_flag_for_session_cookie
  }
  fastify.register(secureSession, {
    key: [
      Buffer.from(secure_session_key_one_buf, 'hex'),
      Buffer.from(secure_session_key_two_buf, 'hex')
    ],
    sessionName,
    expiry: secure_session_expiration,
    cookie
  })
  fastify.log.debug(
    {
      sessionName,
      expiry: secure_session_expiration,
      cookie
    },
    `${LOG_PREFIX}registered plugin: @fastify/secure-session`
  )

  fastify.register(sensible)
  fastify.log.debug(`${LOG_PREFIX}registered plugin: @fastify/sensible`)

  // fastify.register(fastifyCsrf, {
  //   // In OAuth 2.0, the state parameter is used to prevent CSRF attacks when
  //   // doing authorization requests. We use the same name for the session key.
  //   // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
  //   sessionKey: 'state',
  //   sessionPlugin: '@fastify/secure-session'
  // })

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
  })
  fastify.log.debug(`${LOG_PREFIX}registered plugin: @fastify/static`)

  fastify.setNotFoundHandler(defNotFoundHandler({ ajv, reportAllAjvErrors }))

  if (use_development_error_handler) {
    fastify.setErrorHandler(defErrorHandlerDev({ preLines: 5 }))
  } else {
    fastify.setErrorHandler(
      defErrorHandlerProd({
        includeErrorDescription,
        telegram: { chat_id: telegram_chat_id, token: telegram_token }
      })
    )
  }

  const authOptions: AuthorizationEndpointPluginOptions = {
    ajv,
    authorizationCodeExpiration,
    components: {
      'the-footer': path.join(webc_components, 'custom-footer.webc'),
      'the-header': path.join(webc_components, 'custom-header.webc')
    },
    includeErrorDescription,
    issuer,
    reportAllAjvErrors,
    onAuthorizationCodeVerified,
    onUserApprovedRequest,
    retrieveAuthorizationCode
  }

  fastify.register(auth, authOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/auth/config',
      exclude: ['ajv'],
      pluginOptions: authOptions
    })
  }

  fastify.register(micropubClient, {
    ajv,
    authorizationEndpoint,
    clientId: indieauth_client_id,
    clientName: indieauth_client_name,
    clientLogoUri: indieauth_client_logo_uri,
    clientUri: indieauth_client_uri,
    githubAuthStartPath,
    githubAuthRedirectPath,
    githubOAuthClientId,
    githubOAuthClientSecret,
    includeErrorDescription,
    introspectionEndpoint,
    isAccessTokenRevoked,
    issuer,
    me,
    micropubEndpoint,
    redirectUris: indieauth_client_redirect_uris,
    reportAllAjvErrors,
    revocationEndpoint,
    submitEndpoint,
    tokenEndpoint,
    userinfoEndpoint
  })

  fastify.register(introspection, {
    ajv,
    includeErrorDescription,
    isAccessTokenRevoked,
    issuer,
    jwksUrl: jwks_url,
    me,
    reportAllAjvErrors,
    retrieveAccessToken,
    retrieveRefreshToken
  })

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/introspect/config',
      exclude: ['ajv'],
      pluginOptions: {
        ajv,
        includeErrorDescription,
        isAccessTokenRevoked,
        issuer,
        jwksUrl: jwks_url,
        reportAllAjvErrors
      }
    })
  }

  const revocationOptions = {
    ajv,
    includeErrorDescription,
    isAccessTokenRevoked,
    issuer,
    jwksUrl: jwks_url,
    maxAccessTokenAge: access_token_expiration,
    me,
    reportAllAjvErrors,
    retrieveAccessToken,
    retrieveRefreshToken,
    revokeAccessToken,
    revokeRefreshToken
  }

  fastify.register(revocation, revocationOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/revoke/config',
      exclude: ['ajv'],
      pluginOptions: revocationOptions
    })
  }

  const tokenOptions: TokenEndpointPluginOptions = {
    accessTokenExpiration: access_token_expiration,
    ajv,
    authorizationEndpoint,
    includeErrorDescription,
    isAccessTokenRevoked,
    issuer,
    jwks,
    onIssuedTokens,
    refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors,
    retrieveRefreshToken,
    revocationEndpoint,
    userinfoEndpoint
  }

  fastify.register(token, tokenOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/token/config',
      pluginOptions: tokenOptions,
      exclude: ['ajv', 'jwks']
    })
  }

  const userinfoOptions: UserinfoEndpointPluginOptions = {
    ajv,
    includeErrorDescription,
    isAccessTokenRevoked,
    reportAllAjvErrors,
    retrieveUserProfile
  }

  fastify.register(userinfo, userinfoOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/userinfo/config',
      pluginOptions: userinfoOptions,
      exclude: ['ajv']
    })
  }

  const domain = me.split('https://').at(-1)?.replace('/', '') as string

  const publication = defDefaultPublication({ domain, subdomain: 'www' })

  const github = defGitHub({
    // This doesn't work. It errors with: this[writeSym] is not a function
    // log: { debug: fastify.log.debug, error: fastify.log.error },
    log: {
      debug: (message: string) => {
        return fastify.log.debug(`[app/github-store] ${message}`)
      },
      error: (message: string) => {
        return fastify.log.error(`[app/github-store] ${message}`)
      }
    },
    owner: github_owner,
    publication,
    repo: github_repo,
    soft_delete: soft_delete,
    token: github_token,
    committer: {
      name: 'Giacomo Debidda',
      email: 'giacomo@giacomodebidda.com'
    }
  })

  const r2 = defR2({
    account_id: cloudflare_account_id,
    bucket_name: cloudflare_r2_bucket_name,
    credentials: {
      accessKeyId: cloudflare_r2_access_key_id,
      secretAccessKey: cloudflare_r2_secret_access_key
    },
    ignore_filename: should_media_endpoint_ignore_filename,
    public_base_url: media_public_base_url
  })

  const mediaOptions: MediaEndpointPluginOptions = {
    ajv,
    delete: r2.delete,
    includeErrorDescription,
    isAccessTokenRevoked,
    me,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    upload: r2.upload
  }

  fastify.register(media, mediaOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/media/config',
      pluginOptions: mediaOptions,
      exclude: ['ajv']
    })
  }

  const micropubOptions: MicropubEndpointPluginOptions = {
    create: github.create,
    delete: github.delete,
    includeErrorDescription,
    isAccessTokenRevoked,
    me,
    mediaEndpoint,
    micropubEndpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    syndicateTo: syndicate_to,
    // undelete: async (url) => {
    //   const value = await github.undelete!(url)
    //   console.log(`undeleted post at url ${url}`, value)
    //   return value
    // },
    undelete: github.undelete,
    update: github.update
  }

  fastify.register(micropub, micropubOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/micropub/config',
      pluginOptions: micropubOptions,
      exclude: ['ajv']
    })
  }

  const { uid } = syndicate_to.filter((d) => d.uid.includes('t.me'))[0]!

  const telegram_syndicator = defSyndicator({
    chat_id: telegram_chat_id,
    token: telegram_token,
    uid
  })

  const syndicateOptions = {
    ajv,
    get: github.retrieveContent,
    includeErrorDescription,
    isAccessTokenRevoked,
    me,
    publishedUrlToStorageLocation: github.websiteUrlToStoreLocation,
    syndicators: { [uid]: telegram_syndicator },
    reportAllAjvErrors,
    update: github.update
  }

  fastify.register(syndicate, syndicateOptions)

  if (process.env.NODE_ENV === 'development') {
    fastify.register(renderConfig, {
      route: '/syndication/config',
      pluginOptions: syndicateOptions,
      exclude: ['ajv']
    })
  }

  fastify.register(renderConfig, {
    route: '/config',
    pluginOptions: config,
    exclude: [
      'ajv',
      'cloudflare_r2_access_key_id',
      'cloudflare_r2_secret_access_key',
      'github_oauth_client_secret',
      'github_token',
      'jwks',
      'secure_session_key_one_buf',
      'secure_session_key_two_buf',
      'telegram_token'
    ]
  })

  // fastify.register(webc, {
  //   components: ['src/components/**/*.webc'],
  //   templates: [path.join(__dirname, 'templates')]
  // })

  // TODO: register this plugin in micropub-client, not here.
  // https://github.com/fastify/point-of-view?tab=readme-ov-file#using-fastifyview-as-a-dependency-in-a-fastify-plugin
  // Also, should I use viewAsync?
  // https://github.com/fastify/point-of-view?tab=readme-ov-file#migrating-from-view-to-viewasync
  fastify.register(view, {
    engine: { nunjucks },
    templates: [path.join(__dirname, 'templates')],
    options: {
      onConfigure: (env: Environment) => {
        const xs = [
          { name: 'secondsToUTCString', fn: secondsToUTCString },
          { name: 'tap', fn: tap }
        ]
        xs.forEach(({ name, fn }) => env.addFilter(name, fn))
        const filters = xs.map(({ name }) => name).join(', ')

        // const gg = [{ name: 'node_env', value: nunjucks_globals.node_env }]
        const gg = Object.entries(nunjucks_globals).map(([name, value]) => {
          return { name, value }
        })
        gg.forEach(({ name, value }) => env.addGlobal(name, value))
        const globals = gg.map(({ name }) => name).join(', ')

        fastify.log.debug(
          { filters, globals },
          `${LOG_PREFIX}configured nunjucks environment`
        )
      }
    }
  })
  fastify.log.debug(`${LOG_PREFIX}registered plugin: @fastify/view`)

  // === DECORATORS ========================================================= //
  fastify.decorateReply('successResponse', successResponse)
  fastify.log.debug(`${LOG_PREFIX}decorated fastify.reply with successResponse`)

  // === HOOKS ============================================================== //

  // === ROUTES ============================================================= //
  // fastify.get('/demo-webc', function (_request, reply) {
  //   // see authorize-page.ts
  //   const data = {
  //     description:
  //       'Page where the user can approve or deny the authorization request',
  //     redirect_path_on_submit: '/consent',
  //     title: 'Authorize'
  //   }
  //   return reply.render('authorize.webc', data)
  // })

  return fastify
}
