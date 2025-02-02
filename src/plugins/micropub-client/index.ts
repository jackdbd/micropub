// import crypto from 'node:crypto'
import fastifyCsrf from '@fastify/csrf-protection'
import formbody from '@fastify/formbody'
import oauth2 from '@fastify/oauth2'
import { applyToDefaults } from '@hapi/hoek'
import { client_metadata } from '@jackdbd/indieauth'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { DEFAULT, NAME } from './constants.js'
import { errorResponse, successResponse } from './decorators/index.js'
import { defRedirectWhenNotAuthenticated } from './hooks/redirect-when-not-authenticated.js'
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
    micropubEndpoint: micropub_endpoint,
    redirectUris: redirect_uris,
    reportAllAjvErrors: report_all_ajv_errors,
    revocationEndpoint: revocation_endpoint,
    submitEndpoint: submit_endpoint,
    tokenEndpoint: token_endpoint,
    userinfoEndpoint: userinfo_endpoint
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
    // generateStateFunction: (request) => {
    //   const state = crypto.randomBytes(16).toString('base64url')
    //   request.session.set('state', state)
    //   request.log.debug(
    //     `${log_prefix}generated state (CSRF token) and set it in session`
    //   )
    //   return state
    // },
    // checkStateFunction: (request) => {
    //   const query = request.query as { code: string; state: string }
    //   if (query.state !== request.session.state) {
    //     const error_description = `Parameter 'state' found in query string does not match key 'state' found in session.`
    //     throw new InvalidRequestError({ error_description })
    //   }
    //   return true
    // }
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

  const redirectWhenNotAuthenticated = defRedirectWhenNotAuthenticated({
    isAccessTokenRevoked,
    logPrefix: `${log_prefix}[hook] `,
    redirectPath: '/login'
  })

  // === ROUTES ============================================================= //
  fastify.get('/', async (request, reply) => {
    request.log.warn(request.session.data(), `${log_prefix}session_data`)

    const access_token = request.session.get('access_token')
    const refresh_token = request.session.get('refresh_token')
    request.log.warn(`${log_prefix}access_token: ${access_token}`)
    request.log.warn(`${log_prefix}refresh_token: ${refresh_token}`)

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
    { onRequest: [redirectWhenNotAuthenticated] },
    defEditor({ submit_endpoint })
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

  //   fastify.get(google_auth_redirect_path, defGoogleCallback())

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
    { onRequest: [redirectWhenNotAuthenticated] },
    defSubmit({ include_error_description, log_prefix, micropub_endpoint })
  )

  fastify.get(
    '/token',
    {
      // onRequest: [redirectWhenNotAuthenticated]
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
    // { onRequest: [], schema: {} },
    defRefreshAccessToken({
      authorization_endpoint,
      client_id,
      client_logo_uri,
      client_name,
      client_uri,
      include_error_description,
      introspection_endpoint,
      log_prefix,
      redirect_path_on_error,
      redirect_path_on_submit: '/refresh-access-token/start',
      redirect_path_on_success,
      redirect_uri,
      revocation_endpoint,
      token_endpoint
    })
  )

  fastify.get(
    '/refresh-access-token/start',
    // { onRequest: [], schema: {} },
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
      onRequest: [redirectWhenNotAuthenticated]
    },
    defUserGet({ include_error_description, log_prefix, userinfo_endpoint })
  )

  done()
}

export default fp(micropubClient, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
