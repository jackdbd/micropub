import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyCsrf from '@fastify/csrf-protection'
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
import type { ErrorResponseBody } from './lib/micropub/index.js'
import { defR2 } from './lib/r2-storage/client.js'
import { Action } from './lib/schemas/index.js'
import { defSyndicator } from './lib/telegram-syndicator/index.js'
import type { AccessTokenClaims } from './lib/token/claims.js'

import youch from './plugins/youch/index.js'
import errorHandler from './plugins/error-handler/index.js'
import indieauth from './plugins/indieauth/index.js'
import media from './plugins/media-endpoint/index.js'
import micropub from './plugins/micropub-endpoint/index.js'
import type { NoScopeResponseOptions } from './plugins/micropub-endpoint/decorators/request.js'
import type { ResponseConfig } from './plugins/micropub-endpoint/decorators/reply.js'
import introspection from './plugins/introspection-endpoint/index.js'
import responseDecorators from './plugins/response-decorators/index.js'
import type {
  BaseErrorResponseBody,
  BaseSuccessResponseBody
} from './plugins/response-decorators/index.js'
import revocation from './plugins/revocation-endpoint/index.js'
import syndicate from './plugins/syndicate-endpoint/index.js'
import userinfo from './plugins/userinfo-endpoint/index.js'
import token from './plugins/token-endpoint/index.js'

import { sensitive_fields, unsentiveEntries, type Config } from './config.js'
import { tap } from './nunjucks/filters.js'

// Token storage - Filesystem backend //////////////////////////////////////////
import {
  defAddToIssuedTokens,
  defMarkTokenAsRevoked,
  defIsBlacklisted,
  init
} from './lib/fs-storage/index.js'
////////////////////////////////////////////////////////////////////////////////

// Token storage - In-memory backend ///////////////////////////////////////////
// import {
//   defAddToIssuedTokens,
//   defMarkTokenAsRevoked,
//   defIsBlacklisted,
//   init
// } from './lib/in-memory-storage/index.js'
////////////////////////////////////////////////////////////////////////////////

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const NAME = 'app'
const PREFIX = `${NAME} `

declare module 'fastify' {
  interface FastifyRequest {
    noScopeResponse: (
      action: Action,
      options?: NoScopeResponseOptions
    ) => { code: number; body: ErrorResponseBody }
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
    refresh_token: string
    scope: string
    state: string
  }
}

/**
 * Instantiates the Fastify app.
 */
export async function defFastify(config: Config) {
  // TODO: validate config with Ajv
  const {
    access_token_expiration,
    authorization_callback_route: authorizationCallbackRoute,
    authorization_endpoint: authorizationEndpoint,
    base_url: baseUrl,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_owner,
    github_repo,
    github_token,
    include_error_description: includeErrorDescription,
    indieauth_client_id,
    issuer,
    jwks,
    jwks_url,
    log_level,
    me,
    media_endpoint: mediaEndpoint,
    media_public_base_url,
    micropub_endpoint: micropubEndpoint,
    multipart_form_data_max_file_size: multipartFormDataMaxFileSize,
    report_all_ajv_errors: reportAllAjvErrors,
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
    use_secure_flag_for_session_cookie
  } = config

  // Token storage - Filesystem backend ////////////////////////////////////////
  const filepath = await init({
    dirpath: path.join(__dirname, '..', 'assets'),
    filename: 'issued-access-tokens.json'
  })
  const addToIssuedTokens = defAddToIssuedTokens({ filepath })
  const isBlacklisted = defIsBlacklisted({ filepath })
  const markTokenAsRevoked = defMarkTokenAsRevoked({ filepath })
  //////////////////////////////////////////////////////////////////////////////

  // Token storage - In-memory backend /////////////////////////////////////////
  // const atom = await init()
  // const addToIssuedTokens = defAddToIssuedTokens({ atom })
  // const isBlacklisted = defIsBlacklisted({ atom })
  // const markTokenAsRevoked = defMarkTokenAsRevoked({ atom })
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

  fastify.setNotFoundHandler((_request, reply) => {
    return reply.notFound()
  })

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
    `${PREFIX}secure session created`
  )

  fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/secure-session'
  })

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
  })

  if (use_development_error_handler) {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(errorHandler, {
      telegram: { chat_id: telegram_chat_id, token: telegram_token }
    })
  }

  fastify.register(responseDecorators)

  fastify.register(token, {
    addToIssuedTokens,
    authorizationEndpoint,
    expiration: access_token_expiration,
    includeErrorDescription,
    isBlacklisted,
    issuer,
    jwks,
    reportAllAjvErrors
  })

  fastify.register(introspection, {
    expiration: access_token_expiration,
    includeErrorDescription,
    isBlacklisted,
    issuer,
    jwks_url,
    reportAllAjvErrors
  })

  fastify.register(revocation, {
    includeErrorDescription,
    isBlacklisted,
    issuer,
    jwks_url,
    markTokenAsRevoked,
    maxTokenAge: access_token_expiration,
    me,
    reportAllAjvErrors
  })

  fastify.register(userinfo, {
    includeErrorDescription,
    isBlacklisted,
    me,
    reportAllAjvErrors
  })

  fastify.register(indieauth, {
    authorizationCallbackRoute,
    authorizationEndpoint,
    baseUrl,
    clientId: indieauth_client_id,
    me
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
    delete: r2.delete,
    includeErrorDescription,
    isBlacklisted,
    me,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    upload: r2.upload
  })

  fastify.register(micropub, {
    authorizationCallbackRoute,
    baseUrl,
    clientId: indieauth_client_id,
    create: github.create,
    delete: github.delete,
    includeErrorDescription,
    isBlacklisted,
    me,
    mediaEndpoint,
    micropubEndpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    submitEndpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint,
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
    get: github.get,
    includeErrorDescription,
    isBlacklisted,
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
          `${PREFIX}configured nunjucks environment. Filters: ${filters}`
        )
      }
    }
  })

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //

  // === ROUTES ============================================================= //
  fastify.get('/', async (_request, reply) => {
    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'World'
    })
  })

  fastify.get('/config', async (_request, reply) => {
    const non_sensitive = Object.fromEntries(unsentiveEntries(config))

    return reply.successResponse(200, {
      title: 'Config',
      description: 'Configuration page the app',
      summary: 'Configuration of the app',
      payload: {
        non_sensitive,
        sensitive_fields
      }
    })
  })

  return fastify
}
