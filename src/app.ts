import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
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
import { defSyndicator } from './lib/telegram-syndicator/index.js'
import type { AccessTokenClaims } from './lib/token/index.js'

import auth from './plugins/authorization-endpoint/index.js'
import indieauthClient from './plugins/indieauth-client/index.js'
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

// Filesystem storage backend //////////////////////////////////////////////////
import {
  defAddToIssuedTokens,
  defIsAccessTokenBlacklisted,
  defMarkAuthorizationCodeAsUsed,
  defMarkTokenAsRevoked,
  defRetrieveAuthorizationCode,
  defStoreAuthorizationCode,
  init
} from './lib/fs-storage/index.js'
////////////////////////////////////////////////////////////////////////////////

// In-memory storage backend ///////////////////////////////////////////////////
// import {
//   defAddToIssuedTokens,
//   defIsAccessTokenBlacklisted,
//   defMarkAuthorizationCodeAsUsed,
//   defMarkTokenAsRevoked,
//   defRetrieveAuthorizationCode,
//   defStoreAuthorizationCode,
//   initAccessTokensStorage,
//   initAuthorizationCodesStorage,
//   initClientsStorage
// } from './lib/in-memory-storage/index.js'
////////////////////////////////////////////////////////////////////////////////

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
    indieauth_client_id: indieAuthClientId,
    indieauth_client_logo_uri: indieAuthLogoUri,
    indieauth_client_name: indieAuthClientName,
    indieauth_client_redirect_uris: indieAuthRedirectUris,
    indieauth_client_uri: indieAuthClientUri,
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
    userinfo_endpoint: userinfoEndpoint
  } = config

  // We would need all these extra formats to fully support fluent-json-schema.
  // https://github.com/ajv-validator/ajv-formats#formats
  // However, it seems that for this app we only need these formats.
  const ajv = addFormats(new Ajv({ allErrors: reportAllAjvErrors }), [
    'date',
    'date-time',
    'duration',
    'email',
    // 'hostname',
    // 'ipv4',
    // 'ipv6',
    // 'json-pointer',
    // 'regex',
    // 'relative-json-pointer',
    // 'time',
    'uri'
    // 'uri-reference',
    // 'uri-template',
    // 'uuid'
  ])

  // console.log(`=== app config ===`)
  // console.log(config)

  // Authorization code storage - Filesystem backend ///////////////////////////
  const filepath_codes = await init({
    dirpath: path.join(__dirname, '..', 'assets'),
    filename: 'authorization-codes.json'
  })

  const storeAuthorizationCode = defStoreAuthorizationCode({
    ajv,
    filepath: filepath_codes,
    report_all_ajv_errors: reportAllAjvErrors
  })

  const retrieveAuthorizationCode = defRetrieveAuthorizationCode({
    ajv,
    filepath: filepath_codes,
    report_all_ajv_errors: reportAllAjvErrors
  })

  const markAuthorizationCodeAsUsed = defMarkAuthorizationCodeAsUsed({
    ajv,
    filepath: filepath_codes,
    report_all_ajv_errors: reportAllAjvErrors
  })
  //////////////////////////////////////////////////////////////////////////////

  // Authorization code storage - In-memory backend ////////////////////////////
  // const atom_codes = await initCodesStorage()
  // const storeAuthorizationCode = defStoreAuthorizationCode({
  //   ajv,
  //   atom: atom_codes,
  //   report_all_ajv_errors: reportAllAjvErrors
  // })
  // const markAuthorizationCodeAsUsed = defMarkAuthorizationCodeAsUsed({
  //   atom: atom_codes
  // })
  //////////////////////////////////////////////////////////////////////////////

  // Clients storage - Filesystem backend //////////////////////////////////////
  // const filepath_clients = await init({
  //   dirpath: path.join(__dirname, '..', 'assets'),
  //   filename: 'clients.json'
  // })
  // const registerClient = defRegisterClient({ filepath: filepath_clients })
  //////////////////////////////////////////////////////////////////////////////

  // Token storage - Filesystem backend ////////////////////////////////////////
  const filepath_tokens = await init({
    dirpath: path.join(__dirname, '..', 'assets'),
    filename: 'access-tokens.json'
  })
  const addToIssuedTokens = defAddToIssuedTokens({ filepath: filepath_tokens })
  const isAccessTokenBlacklisted = defIsAccessTokenBlacklisted({
    filepath: filepath_tokens
  })
  const markTokenAsRevoked = defMarkTokenAsRevoked({
    filepath: filepath_tokens
  })
  //////////////////////////////////////////////////////////////////////////////

  // Token storage - In-memory backend /////////////////////////////////////////
  // const atom_tokens = await initAccessTokensStorage()
  // const addToIssuedTokens = defAddToIssuedTokens({ atom: atom_tokens })
  // const isAccessTokenBlacklisted = defIsAccessTokenBlacklisted({
  //   atom: atom_tokens
  // })
  // const markTokenAsRevoked = defMarkTokenAsRevoked({ atom: atom_tokens })
  //////////////////////////////////////////////////////////////////////////////

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
    // fastify.setErrorHandler(
    //   defErrorHandlerProd({
    //     includeErrorDescription,
    //     includeErrorDetails: true,
    //     telegram: { chat_id: telegram_chat_id, token: telegram_token }
    //   })
    // )
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
    markAuthorizationCodeAsUsed,
    reportAllAjvErrors,
    retrieveAuthorizationCode,
    storeAuthorizationCode
  })

  fastify.register(indieauthClient, {
    ajv,
    clientId: indieAuthClientId,
    clientName: indieAuthClientName,
    clientUri: indieAuthClientUri,
    logoUri: indieAuthLogoUri,
    redirectUris: indieAuthRedirectUris,
    reportAllAjvErrors
  })

  fastify.register(micropubClient, {
    ajv,
    authorizationEndpoint,
    githubAuthStartPath,
    githubAuthRedirectPath,
    githubOAuthClientId,
    githubOAuthClientSecret,
    indieAuthClientId,
    introspectionEndpoint,
    isAccessTokenBlacklisted,
    issuer,
    micropubEndpoint,
    redirectUris: indieAuthRedirectUris,
    reportAllAjvErrors,
    revocationEndpoint,
    submitEndpoint,
    tokenEndpoint,
    userinfoEndpoint
  })

  fastify.register(introspection, {
    ajv,
    isAccessTokenBlacklisted,
    issuer,
    jwksUrl: jwks_url,
    reportAllAjvErrors
  })

  fastify.register(revocation, {
    ajv,
    isAccessTokenBlacklisted,
    issuer,
    jwksUrl: jwks_url,
    markTokenAsRevoked,
    maxTokenAge: access_token_expiration,
    me,
    reportAllAjvErrors
  })

  fastify.register(token, {
    accessTokenExpiration: access_token_expiration,
    addToIssuedTokens,
    ajv,
    authorizationEndpoint,
    includeErrorDescription,
    issuer,
    jwks,
    refreshTokenExpiration: refresh_token_expiration,
    reportAllAjvErrors
  })

  fastify.register(userinfo, {
    ajv,
    isAccessTokenBlacklisted,
    me,
    reportAllAjvErrors
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
    isAccessTokenBlacklisted,
    me,
    publishedUrlToStorageLocation: github.publishedUrlToStorageLocation,
    syndicators: { [uid]: telegram_syndicator },
    reportAllAjvErrors,
    update: github.update
  })

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
  fastify.get('/', async (_request, reply) => {
    // request.log.warn(request.session.data(), `${LOG_PREFIX}session_data`)
    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'World'
    })
  })

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
