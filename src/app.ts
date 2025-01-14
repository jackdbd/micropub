import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import type { OAuth2Namespace } from '@fastify/oauth2'
import { fastifyRequestContext } from '@fastify/request-context'
import secureSession from '@fastify/secure-session'
import fastifyStatic from '@fastify/static'
import view from '@fastify/view'
import sensible from '@fastify/sensible'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'

import { secondsToUTCString } from './lib/date.js'
import { defDefaultPublication } from './lib/github-storage/publication.js'
import { defGitHub } from './lib/github-storage/client.js'
import { defR2 } from './lib/r2-storage/client.js'
import type { SelectQuery } from './lib/storage-api/index.js'
import { defStorage } from './lib/storage-implementations/index.js'
import { defSyndicator } from './lib/telegram-syndicator/index.js'
import type { AccessTokenClaims } from './lib/token/index.js'

import auth from './plugins/authorization-endpoint/index.js'
import media from './plugins/media-endpoint/index.js'
import micropubClient, {
  type BaseErrorResponseBody,
  type BaseSuccessResponseBody
} from './plugins/micropub-client/index.js'
import micropub from './plugins/micropub-endpoint/index.js'
import type { ResponseConfig } from './plugins/micropub-endpoint/decorators/reply.js'
import introspection from './plugins/introspection-endpoint/index.js'
import revocation from './plugins/revocation-endpoint/index.js'
import syndicate from './plugins/syndicate-endpoint/index.js'
import userinfo from './plugins/userinfo-endpoint/index.js'
import token from './plugins/token-endpoint/index.js'
import { successResponse } from './plugins/micropub-client/decorators/index.js'

import { defAjv } from './ajv.js'
import {
  entriesSafeToRender,
  DO_NOT_RENDER,
  SENSITIVE,
  type Config
} from './config.js'
import {
  defErrorHandlerDev,
  defErrorHandlerProd
} from './error-handlers/index.js'
import { defNotFoundHandler } from './not-found-handlers/index.js'
import { tap } from './nunjucks/filters.js'
import {
  defAuthorizationCodeHandlers,
  defTokenHandlers
} from './storage-handlers/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const NAME = 'app'
const LOG_PREFIX = `${NAME} `

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

    micropubResponse(jf2: Jf2, config: ResponseConfig): Promise<void>
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    jf2?: Jf2
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

  const ajv = defAjv({ allErrors: reportAllAjvErrors })

  const environment = NODE_ENV === 'production' ? 'prod' : 'dev'

  const { error: storage_error, value: storage } = defStorage({
    ajv,
    backend: 'sqlite',
    env: environment
  })

  if (storage_error) {
    throw storage_error
  }

  const retrieveProfile = async (query: SelectQuery) => {
    return storage.user_profile.retrieveOne(query)
  }

  const {
    onAuthorizationCodeVerified,
    onUserApprovedRequest,
    retrieveAuthorizationCode
  } = defAuthorizationCodeHandlers(storage.authorization_code)

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

  const {
    isAccessTokenRevoked: isAccessTokenBlacklisted,
    issueTokens,
    retrieveAccessToken,
    retrieveRefreshToken
  } = defTokenHandlers({
    access_tokens_storage: storage.access_token,
    refresh_tokens_storage: storage.refresh_token,
    log: {
      debug: (message: string) => {
        fastify.log.debug(`token-handler ${message}`)
      },
      error: (message: string) => {
        fastify.log.error(`token-handler ${message}`)
      }
    }
  })

  // === PLUGINS ============================================================ //
  fastify.register(sensible)

  fastify.register(fastifyRequestContext, {
    // defaultStoreValues: {
    //   user: { id: 'system' }
    // }
  })

  const sessionName = 'session'

  fastify.register(secureSession, {
    key: [
      Buffer.from(secure_session_key_one_buf, 'hex'),
      Buffer.from(secure_session_key_two_buf, 'hex')
    ],
    sessionName,
    expiry: secure_session_expiration,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: use_secure_flag_for_session_cookie
    }
  })
  fastify.log.debug(
    {
      sessionName,
      expiry: secure_session_expiration
    },
    `${LOG_PREFIX}secure session created`
  )

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

  fastify.register(auth, {
    ajv,
    authorizationCodeExpiration,
    includeErrorDescription,
    issuer,
    reportAllAjvErrors,
    onAuthorizationCodeVerified,
    onUserApprovedRequest,
    retrieveAuthorizationCode
  })

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
    isAccessTokenBlacklisted,
    issuer,
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
    isAccessTokenBlacklisted,
    issuer,
    jwksUrl: jwks_url,
    reportAllAjvErrors
  })

  fastify.register(revocation, {
    ajv,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    issuer,
    jwksUrl: jwks_url,
    maxAccessTokenAge: access_token_expiration,
    me,
    reportAllAjvErrors,
    retrieveAccessToken,
    retrieveRefreshToken
    // storeAccessToken,
    // storeRefreshToken
  })

  fastify.register(token, {
    accessTokenExpiration: access_token_expiration,
    ajv,
    authorizationEndpoint,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    issuer,
    issueTokens,
    jwks,
    refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors,
    retrieveRefreshToken,
    revocationEndpoint,
    userinfoEndpoint
  })

  fastify.register(userinfo, {
    ajv,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    // me,
    reportAllAjvErrors,
    retrieveProfile
  })

  const domain = me.split('https://').at(-1)?.replace('/', '') as string

  const publication = defDefaultPublication({ domain, subdomain: 'www' })

  const github = defGitHub({
    // This doesn't work. It errors with: this[writeSym] is not a function
    // log: { debug: fastify.log.debug, error: fastify.log.error },
    log: {
      debug: (message: string) => {
        return fastify.log.debug(`@jackdbd/github-store ${message}`)
      },
      error: (message: string) => {
        return fastify.log.error(`@jackdbd/github-store ${message}`)
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

  fastify.register(media, {
    ajv,
    delete: r2.delete,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    me,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    upload: r2.upload
  })

  fastify.register(micropub, {
    ajv,
    create: github.create,
    delete: github.delete,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    me,
    mediaEndpoint,
    micropubEndpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    syndicateTo: syndicate_to,
    undelete: github.undelete,
    update: github.update
  })

  const { uid } = syndicate_to.filter((d) => d.uid.includes('t.me'))[0]!

  const telegram_syndicator = defSyndicator({
    chat_id: telegram_chat_id,
    token: telegram_token,
    uid
  })

  fastify.register(syndicate, {
    ajv,
    get: github.get,
    includeErrorDescription,
    isAccessTokenBlacklisted,
    me,
    publishedUrlToStorageLocation: github.publishedUrlToStorageLocation,
    syndicators: { [uid]: telegram_syndicator },
    reportAllAjvErrors,
    update: github.update
  })

  // TODO: register this plugin in micropub-client, not here.
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

        // const gg = [{ name: 'foo', value: foo }]
        // gg.forEach(({ name, value }) => env.addGlobal(name, value))
        // const globals = gg.map(({ name }) => name).join(', ')

        fastify.log.debug(
          `${LOG_PREFIX}configured nunjucks environment. Filters: ${filters}`
        )
      }
    }
  })

  // === DECORATORS ========================================================= //
  fastify.decorateReply('successResponse', successResponse)
  fastify.log.debug(`${LOG_PREFIX}decorated fastify.reply with successResponse`)

  // === HOOKS ============================================================== //

  // === ROUTES ============================================================= //

  fastify.get('/config', async (_request, reply) => {
    return reply.successResponse(200, {
      title: 'Config',
      description: 'Configuration page the app',
      summary: 'Configuration of the app',
      payload: {
        ...Object.fromEntries(entriesSafeToRender(config)),
        not_shown: [...DO_NOT_RENDER.keys(), ...SENSITIVE.keys()]
      }
    })
  })

  return fastify
}
