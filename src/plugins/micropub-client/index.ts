import fastifyCsrf from '@fastify/csrf-protection'
import formbody from '@fastify/formbody'
import oauth2 from '@fastify/oauth2'
import { applyToDefaults } from '@hapi/hoek'
import canonicalUrl from '@jackdbd/canonical-url'
import { defLogClaims } from '@jackdbd/fastify-hooks'
import {
  client_metadata,
  isExpired,
  msToUTCString,
  unixTimestampInSeconds
} from '@jackdbd/indieauth'
import {
  InvalidRequestError,
  ServerError
} from '@jackdbd/oauth2-error-responses'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

import { DEFAULT, NAME } from './constants.js'
import { errorResponse, successResponse } from './decorators/index.js'
import {
  defRefreshTokensIfNeeded,
  defSetClaimsInRequestContext,
  defValidateClaim,
  defValidateNotRevoked,
  defValidateScope
} from './hooks/index.js'
import { defAuthenticate } from './routes/authenticate-start.js'
import { defAuthorizationEmailStart } from './routes/auth-email-start.js'
import { defAuthorizationCallback as defGitHubCallback } from './routes/auth-github-callback.js'
import { defIdGet } from './routes/id-get.js'
import { defIndieAuthStart } from './routes/auth-indieauth-start.js'
import { defAuthorizationCallback } from './routes/authorization-callback.js'
import { defRefreshAccessToken } from './routes/refresh-access-token-get.js'
import { defRefreshAccessTokenStart } from './routes/refresh-access-token-start.js'
import { defEditor } from './routes/editor.js'
import { defLogin } from './routes/login.js'
import { defLogout } from './routes/logout.js'
import { postAccepted } from './routes/post-accepted.js'
import { postCreated } from './routes/post-created.js'
import { defSubmit } from './routes/submit.js'
import { defTokenGet } from './routes/token-get.js'
import { defUserGet } from './routes/user-get.js'
import {
  auth_start_get_request_querystring,
  options as options_schema,
  type Options
} from './schemas.js'

export type {
  BaseErrorResponseBody,
  BaseSuccessResponseBody
} from './decorators/index.js'

const defaults: Partial<Options> = {
  authenticationStartPath: DEFAULT.AUTHENTICATION_START_PATH,
  authorizationCallbackPath: DEFAULT.AUTHORIZATION_CALLBACK_PATH,
  codeVerifierLength: DEFAULT.CODE_VERIFIER_LENGTH,
  emailAuthStartPath: DEFAULT.EMAIL_AUTH_START_PATH,
  // emailAuthRedirectPath: DEFAULT.EMAIL_AUTH_REDIRECT_PATH,
  githubAuthStartPath: DEFAULT.GITHUB_AUTH_START_PATH,
  githubAuthRedirectPath: DEFAULT.GITHUB_AUTH_REDIRECT_PATH,
  githubOAuthClientId: DEFAULT.GITHUB_OAUTH_CLIENT_ID,
  githubOAuthClientSecret: DEFAULT.GITHUB_OAUTH_CLIENT_SECRET,
  // googleAuthStartPath: DEFAULT.GOOGLE_AUTH_START_PATH,
  // googleAuthRedirectPath: DEFAULT.GOOGLE_AUTH_REDIRECT_PATH,
  // googleOAuthClientId: DEFAULT.GOOGLE_OAUTH_CLIENT_ID,
  // googleOAuthClientSecret: DEFAULT.GOOGLE_OAUTH_CLIENT_SECRET,
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  indieAuthStartPath: DEFAULT.INDIEAUTH_START_PATH,
  // indieAuthRedirectPath: DEFAULT.INDIEAUTH_REDIRECT_PATH,
  // linkedInAuthStartPath: DEFAULT.LINKEDIN_AUTH_START_PATH,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const micropubClient: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    authenticationStartPath: authentication_start_path,
    authorizationCallbackPath: authorization_callback_path,
    authorizationEndpoint: authorization_endpoint,
    clientId: client_id,
    clientName: client_name,
    clientUri: client_uri,
    clientLogoUri: client_logo_uri,
    codeVerifierLength: code_verifier_length,
    emailAuthStartPath: email_auth_start_path,
    // emailAuthRedirectPath: email_auth_redirect_path,
    githubAuthStartPath: github_auth_start_path,
    githubAuthRedirectPath: github_auth_redirect_path,
    githubOAuthClientId: github_client_id,
    githubOAuthClientSecret: github_client_secret,
    // googleAuthStartPath: google_auth_start_path,
    // googleAuthRedirectPath: google_auth_redirect_path,
    // googleOAuthClientId: google_client_id,
    // googleOAuthClientSecret: google_client_secret,
    includeErrorDescription: include_error_description,
    indieAuthStartPath: indieauth_start_path,
    // indieAuthRedirectPath: indieauth_redirect_path,
    introspectionEndpoint: introspection_endpoint,
    isAccessTokenRevoked,
    issuer,
    logPrefix: log_prefix,
    me,
    micropubEndpoint,
    redirectUris: redirect_uris,
    reportAllAjvErrors: report_all_ajv_errors,
    revocationEndpoint: revocation_endpoint,
    submitEndpoint,
    tokenEndpoint: token_endpoint,
    userinfoEndpoint
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwWhenNotConform(
    { ajv, schema: options_schema, data: config },
    { basePath: 'micropub-client-options' }
  )

  // === PLUGINS ============================================================ //
  fastify.register(formbody)
  fastify.log.debug(
    `${log_prefix}registered plugin: formbody (for parsing application/x-www-form-urlencoded)`
  )

  fastify.register(fastifyCsrf, {
    // In OAuth 2.0, the state parameter is used to prevent CSRF attacks when
    // doing authorization requests. We use the same name for the session key.
    // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
    sessionKey: 'state',
    sessionPlugin: '@fastify/secure-session'
  })

  fastify.register(oauth2, {
    name: 'githubOAuth2',
    // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes
    scope: ['user:email'],
    // scope: ['read:user', 'user:email'],
    credentials: {
      client: {
        id: github_client_id,
        secret: github_client_secret
      },
      auth: oauth2.GITHUB_CONFIGURATION
    },
    startRedirectPath: github_auth_start_path,
    callbackUri: (req) => {
      const scheme = req.host.includes('localhost') ? 'http' : 'https'
      return `${scheme}://${req.host}${github_auth_redirect_path}`
    },
    // https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-web-application-flow-to-generate-a-user-access-token
    callbackUriParams: {
      allow_signup: false
      //   prompt: 'consent' // forces the consent screen to appear every time
    },
    pkce: 'S256'
  })

  // https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
  // fastify.register(oauth2, {
  //   name: 'googleOAuth2',
  //   // https://developers.google.com/identity/protocols/oauth2/scopes
  //   scope: [
  //     'https://www.googleapis.com/auth/userinfo.email',
  //     'https://www.googleapis.com/auth/userinfo.profile'
  //   ],
  //   credentials: {
  //     client: {
  //       id: google_client_id,
  //       secret: google_client_secret
  //     },
  //     auth: oauth2.GOOGLE_CONFIGURATION
  //   },
  //   startRedirectPath: google_auth_start_path,
  //   callbackUri: (req) => {
  //     const scheme = req.host.includes('localhost') ? 'http' : 'https'
  //     return `${scheme}://${req.host}${google_auth_redirect_path}`
  //   },
  //   callbackUriParams: {
  //     // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  //     access_type: 'offline',
  //     prompt: 'consent'
  //   },
  //   pkce: 'S256'
  // })

  // === DECORATORS ========================================================= //
  fastify.decorateReply('errorResponse', errorResponse)
  fastify.log.debug(`${log_prefix}decorated fastify.reply with errorResponse`)

  fastify.decorateReply('successResponse', successResponse)
  fastify.log.debug(`${log_prefix}decorated fastify.reply with successResponse`)

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  const refreshTokensIfNeeded = defRefreshTokensIfNeeded({
    clientId: client_id,
    isAccessTokenRevoked,
    logPrefix: `[${NAME}/refresh-tokens-if-needed] `,
    redirectPath: '/login',
    tokenEndpoint: token_endpoint
  })

  const setClaimsInRequestContext = defSetClaimsInRequestContext({
    logPrefix: `[${NAME}/set-claims] `,
    redirectPath: '/login'
  })

  const logClaims = defLogClaims({
    logPrefix: `[${NAME}/log-claims] `
  })

  const validateClaimExp = defValidateClaim(
    {
      claim: 'exp',
      op: '>',
      value: unixTimestampInSeconds
    },
    { logPrefix: `[${NAME}/validate-claim-exp] ` }
  )

  const validateClaimMe = defValidateClaim(
    {
      claim: 'me',
      op: '==',
      value: canonicalUrl(me)
    },
    { logPrefix: `[${NAME}/validate-claim-me] ` }
  )

  const validateScopeCreate = defValidateScope({
    scope: 'create',
    logPrefix: `[${NAME}/validate-scope-create] `
  })

  const validateScopeProfile = defValidateScope({
    scope: 'profile',
    logPrefix: `[${NAME}/validate-scope-profile] `
  })

  const validateAccessTokenNotRevoked = defValidateNotRevoked({
    isAccessTokenRevoked,
    logPrefix: `[${NAME}/validate-not-revoked] `
  })

  // === ROUTES ============================================================= //
  fastify.get('/', async (request, reply) => {
    // request.log.warn(request.session.data(), `${log_prefix}session_data`)
    // const access_token = request.session.get('access_token')
    // const refresh_token = request.session.get('refresh_token')
    const claims = request.session.get('claims')

    if (claims) {
      const iat_utc = msToUTCString(claims.iat * 1000)
      const exp_utc = msToUTCString(claims.exp * 1000)

      request.log.debug(
        `${log_prefix}access token issued by ${claims.iss} at UNIX timestamp ${claims.iat} (${iat_utc})`
      )

      const expired = isExpired(claims.exp)
      if (expired) {
        request.log.debug(
          `${log_prefix}access token expired at UNIX timestamp ${claims.exp} (${exp_utc})`
        )
      } else {
        request.log.debug(
          `${log_prefix}access token will expire at UNIX timestamp ${claims.exp} (${exp_utc})`
        )
      }
    } else {
      request.log.debug(`${log_prefix}no access token claims found in session`)
    }

    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'World'
    })
  })

  const redirect_uri = redirect_uris[0]

  fastify.get(
    authentication_start_path,
    defAuthenticate({
      email_auth_start_path,
      github_auth_start_path,
      //   google_auth_start_path,
      log_prefix
    })
  )

  fastify.get(
    indieauth_start_path,
    { schema: { querystring: auth_start_get_request_querystring } },
    defIndieAuthStart({
      authorization_endpoint,
      code_verifier_length,
      issuer,
      log_prefix,
      redirect_uri
    })
  )

  fastify.get(
    authorization_callback_path,
    defAuthorizationCallback({
      client_id,
      include_error_description,
      log_prefix,
      redirect_uri,
      token_endpoint
    })
  )

  fastify.get(
    '/editor',
    {
      onRequest: [
        refreshTokensIfNeeded,
        setClaimsInRequestContext,
        logClaims,
        validateClaimExp,
        validateClaimMe,
        validateScopeCreate,
        validateAccessTokenNotRevoked
      ]
    },
    defEditor({ submitEndpoint })
  )

  fastify.get('/accepted', postAccepted)

  fastify.get('/created', postCreated)

  fastify.get(email_auth_start_path, defAuthorizationEmailStart())

  fastify.get(
    github_auth_redirect_path,
    defGitHubCallback({
      indieauth_client_id: client_id,
      indieauth_start_path,
      log_prefix
    })
  )

  fastify.get(
    '/id',
    { schema: { response: { 200: client_metadata } } },
    defIdGet({
      client_id,
      client_logo_uri,
      client_name,
      client_uri,
      log_prefix,
      redirect_uris
    })
  )

  fastify.get('/login', defLogin({ authentication_start_path, log_prefix }))

  fastify.get(
    '/logout',
    defLogout({ include_error_description, log_prefix, revocation_endpoint })
  )

  fastify.post(
    '/submit',
    {
      onRequest: [
        refreshTokensIfNeeded,
        setClaimsInRequestContext,
        validateClaimExp,
        validateAccessTokenNotRevoked
      ]
    },
    defSubmit({
      includeErrorDescription: include_error_description,
      logPrefix: log_prefix,
      micropubEndpoint
    })
  )

  fastify.get(
    '/token',
    {
      onRequest: [
        refreshTokensIfNeeded,
        setClaimsInRequestContext,
        validateClaimExp,
        validateAccessTokenNotRevoked
      ]
    },
    defTokenGet({
      include_error_description,
      introspection_endpoint,
      log_prefix
    })
  )

  const redirect_path_on_error = '/login'
  const redirect_path_on_success = '/token'

  fastify.get(
    '/refresh-access-token',
    defRefreshAccessToken({
      authorization_endpoint,
      client_id,
      client_logo_uri,
      client_name,
      client_uri,
      log_prefix,
      redirect_path_on_error,
      redirect_path_on_submit: '/refresh-access-token/start',
      redirect_path_on_success,
      redirect_uri,
      revocation_endpoint,
      token_endpoint
    })
  )

  // TODO: protect this route with authentication? Redirect to /auth/start?me={me}
  // and authenticate the user using one of the supported providers? (e.g. /auth/github)
  // If the client type is confidential or the client was issued client
  // credentials (or assigned other authentication requirements), the client
  // MUST authenticate with the authorization server.
  // https://datatracker.ietf.org/doc/html/rfc6749#section-6
  fastify.get(
    '/refresh-access-token/start',
    defRefreshAccessTokenStart({
      code_verifier_length,
      include_error_description,
      log_prefix,
      redirect_path_on_error,
      redirect_path_on_success
    })
  )

  fastify.get(
    '/user',
    {
      onRequest: [
        refreshTokensIfNeeded,
        setClaimsInRequestContext,
        validateClaimExp,
        validateClaimMe,
        validateScopeProfile,
        validateAccessTokenNotRevoked
      ]
    },
    defUserGet({
      includeErrorDescription: include_error_description,
      logPrefix: log_prefix,
      userinfoEndpoint
    })
  )

  fastify.setErrorHandler((error, request, reply) => {
    const code = error.statusCode

    // Think about including these data error_description:
    // - some JWT claims (e.g. me, scope)
    // - jf2 (e.g. action, content, h, url)
    // const claims = request.requestContext.get("access_token_claims");
    // const jf2 = request.requestContext.get("jf2");
    // console.log("=== claims ===", claims);
    // console.log("=== jf2 ===", jf2);

    if (code && code >= 400 && code < 500) {
      request.log.warn(
        `${log_prefix}client error (HTTP ${code}) catched by error handler: ${error.message}`
      )
    } else {
      request.log.error(
        `${log_prefix}server error (HTTP ${code}) catched by error handler: ${error.message}`
      )
    }

    // Should we redirect to /login when the access token is expired or revoked?
    if (code === 401) {
      request.log.warn(`${log_prefix}TODO: redirect to /login?`)
      // return reply.redirect('/login')
    }

    // Should we redirect to /login when the access token has insufficient scopes?
    if (code === 403) {
      request.log.warn(`${log_prefix}TODO: redirect to /login?`)
      // return reply.redirect('/login')
    }

    if (error.validation && error.validationContext) {
      if (code && code >= 400 && code < 500) {
        const messages = error.validation.map((ve) => {
          return `${error.validationContext}${ve.instancePath} ${ve.message}`
        })
        const error_description = messages.join('; ')
        const err = new InvalidRequestError({ error_description })
        return reply.errorResponse(
          err.statusCode,
          err.payload({ include_error_description })
        )
      }
    }

    const err = new ServerError({ error_description: error.message })
    return reply.errorResponse(
      err.statusCode,
      err.payload({ include_error_description })
    )
  })

  done()
}

export default fp(micropubClient, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
