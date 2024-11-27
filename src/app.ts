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
import stringify from 'fast-safe-stringify'
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import { secondsToUTCString } from './lib/date.js'
import { defStore } from './lib/github-store/index.js'
import { defMediaStore } from './lib/r2-media-store/index.js'
import type {
  ActionType as MicropubActionType,
  ErrorResponseBody
} from './lib/micropub/index.js'
import { type SuccessPageOptions } from './lib/micropub-html-responses/index.js'
import type { AccessTokenClaims } from './lib/token.js'
import youch from './plugins/youch/index.js'
import errorHandler from './plugins/error-handler/index.js'
import indieauth from './plugins/indieauth/index.js'
import media from './plugins/media-endpoint/index.js'
import micropub from './plugins/micropub-endpoint/index.js'
import introspectionEndpoint from './plugins/introspect-endpoint/index.js'
import revocationEndpoint from './plugins/revocation-endpoint/index.js'
import userinfoEndpoint from './plugins/userinfo-endpoint/index.js'
import tokenEndpoint from './plugins/token-endpoint/index.js'
import { tap } from './nunjucks/filters.js'
import { sensitive_fields, unsentiveEntries, type Config } from './config.js'
import { defDefaultPublication } from './lib/github-store/publication.js'
import {
  NoActionSupportedResponseOptions,
  NoScopeResponseOptions
} from './plugins/micropub-endpoint/decorators/request.js'
import { clientAcceptsHtml } from './lib/fastify-request-predicates/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

declare module 'fastify' {
  interface FastifyRequest {
    hasScope(scope: string): boolean

    noScopeResponse: (
      action: MicropubActionType,
      options?: NoScopeResponseOptions
    ) => { code: number; body: ErrorResponseBody }

    noActionSupportedResponse: (
      action: MicropubActionType,
      options?: NoActionSupportedResponseOptions
    ) => { code: number; body: ErrorResponseBody }
  }
  interface FastifyReply {
    errorResponse(code: number, body: ErrorResponseBody): void

    micropubErrorResponse(code: number, body: ErrorResponseBody): void

    micropubDeleteSuccessResponse(summary?: string): void

    micropubUndeleteSuccessResponse(
      code: number,
      body: SuccessPageOptions
    ): void

    micropubUpdateSuccessResponse(code: number, body: SuccessPageOptions): void

    micropubResponseCard(jf2: any): Promise<void>
    micropubResponseCite(jf2: any): Promise<void>
    micropubResponseEntry(jf2: any): Promise<void>
    micropubResponseEvent(jf2: any): Promise<void>
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    access_token_claims?: AccessTokenClaims
    action?: string
    error_details?: string[]
    jf2?: Jf2
    user: { id: string }
  }
}

// https://github.com/fastify/fastify-secure-session?tab=readme-ov-file#add-typescript-types
declare module '@fastify/secure-session' {
  interface SessionData {
    code_challenge: string
    code_verifier: string
    jwt: string
    scope: string
    state: string
  }
}

/**
 * Instantiates the Fastify app.
 */
export function defFastify(config: Config) {
  const {
    access_token_expiration,
    base_url,
    cloudflare_account_id,
    cloudflare_r2_access_key_id,
    cloudflare_r2_bucket_name,
    cloudflare_r2_secret_access_key,
    github_owner,
    github_repo,
    github_token,
    include_error_description,
    log_level,
    me,
    multipart_form_data_max_file_size: multipartFormDataMaxFileSize,
    report_all_ajv_errors: reportAllAjvErrors,
    secure_session_expiration,
    secure_session_key_one_buf,
    secure_session_key_two_buf,
    should_media_endpoint_ignore_filename,
    soft_delete,
    syndicate_to,
    telegram_chat_id,
    telegram_token,
    use_development_error_handler,
    use_secure_flag_for_session_cookie
  } = config

  const fastify = Fastify({ logger: { level: log_level } })

  fastify.register(sensible)

  fastify.register(fastifyRequestContext, {
    defaultStoreValues: {
      user: { id: 'system' }
    }
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
    `secure session created`
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

  const issuer = base_url
  const client_id = base_url
  // const token_endpoint = 'https://tokens.indieauth.com/token'
  const token_endpoint = `${base_url}/token`
  const micropub_endpoint = `${base_url}/micropub`
  const media_endpoint = `${base_url}/media`
  const submit_endpoint = `${base_url}/submit`
  let media_content_base_url = 'https://content.giacomodebidda.com/'

  fastify.register(tokenEndpoint, {
    expiration: access_token_expiration,
    includeErrorDescription: include_error_description,
    issuer
  })

  fastify.register(introspectionEndpoint, {
    clientId: client_id,
    me,
    include_error_description
  })
  fastify.register(revocationEndpoint, { include_error_description })
  fastify.register(userinfoEndpoint, { include_error_description })

  fastify.register(indieauth, {
    // authorizationCallbackRoute: '/auth/callback',
    // authorizationEndpoint: 'https://indieauth.com/auth',
    baseUrl: base_url,
    clientId: client_id,
    me
  })

  const domain = me.split('https://').at(-1)?.replace('/', '') as string

  const publication = defDefaultPublication({ domain, subdomain: 'www' })

  const store = defStore({
    // I tried to pass fastify.log here, but it errors with: this[writeSym] is not a function
    // log: fastify.log,
    log: console,
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

  const mediaStore = defMediaStore({
    account_id: cloudflare_account_id,
    bucket_name: cloudflare_r2_bucket_name,
    credentials: {
      accessKeyId: cloudflare_r2_access_key_id,
      secretAccessKey: cloudflare_r2_secret_access_key
    },
    ignore_filename: should_media_endpoint_ignore_filename,
    public_base_url: media_content_base_url
  })

  fastify.register(media, {
    includeErrorDescription: include_error_description,
    me,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    store: mediaStore
  })

  fastify.register(micropub, {
    baseUrl: base_url,
    clientId: client_id,
    includeErrorDescription: include_error_description,
    me,
    mediaEndpoint: media_endpoint,
    micropubEndpoint: micropub_endpoint,
    multipartFormDataMaxFileSize,
    reportAllAjvErrors,
    store,
    submitEndpoint: submit_endpoint,
    syndicateTo: syndicate_to,
    tokenEndpoint: token_endpoint
  })

  fastify.register(view, {
    engine: { nunjucks },
    templates: [path.join(__dirname, 'templates')],
    options: {
      onConfigure: (env: Environment) => {
        env.addFilter('secondsToUTCString', secondsToUTCString)
        env.addFilter('tap', tap)
        fastify.log.debug(`nunjucks environment configured`)
      }
    }
  })

  fastify.get('/', async (_request, reply) => {
    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'World'
    })
  })

  fastify.get('/config', async (request, reply) => {
    const non_sensitive = Object.fromEntries(unsentiveEntries(config))

    if (clientAcceptsHtml(request)) {
      // const base_url = `${request.protocol}://${request.host}`
      return reply.code(200).view('config.njk', {
        // base_url,
        title: 'Config',
        description: 'Configuration of the app',
        non_sensitive: stringify(non_sensitive, undefined, 2),
        sensitive_fields
      })
    } else {
      return reply.code(200).send({
        non_sensitive: stringify(non_sensitive, undefined, 2),
        sensitive_fields
      })
    }
  })

  return fastify
}
