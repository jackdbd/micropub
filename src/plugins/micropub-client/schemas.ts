import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  client_id,
  issuer,
  client_name,
  client_uri,
  logo_uri,
  me_before_url_canonicalization,
  me_after_url_canonicalization,
  redirect_uris,
  userinfo_endpoint
} from '../../lib/indieauth/index.js'
import { micropub_endpoint } from '../../lib/micropub/index.js'
import { code_verifier_length } from '../../lib/pkce/index.js'
import {
  authorization_endpoint,
  introspection_endpoint,
  revocation_endpoint,
  token_endpoint
} from '../../lib/oauth2/index.js'
import { report_all_ajv_errors } from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

const isAccessTokenRevoked = Type.Any()
export type IsAccessTokenRevoked = (jti: string) => Promise<boolean>

export const options = Type.Object(
  {
    ajv: Type.Optional(Type.Any()),

    authenticationStartPath: Type.Optional(
      Type.String({ default: DEFAULT.AUTHENTICATION_START_PATH })
    ),

    authorizationCallbackPath: Type.Optional(
      Type.String({ default: DEFAULT.AUTHORIZATION_CALLBACK_PATH })
    ),

    /**
     * Authorization endpoint URL. If not provided, the one found in the OAuth
     * Client ID Metadata Document during
     * [Discovery](https://indieauth.spec.indieweb.org/#discovery) will be used.
     *
     * It's useful to set this option if you are developing an authorization
     * endpoint.
     *
     * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
     */
    authorizationEndpoint: Type.Optional(authorization_endpoint),

    /**
     * IndieAuth/Micropub client identifier. It MUST be a URL.
     *
     * @see [Client Identifier - IndieAuth](https://indieauth.spec.indieweb.org/#client-identifier)
     */
    clientId: client_id,

    clientLogoUri: Type.Optional({
      ...logo_uri,
      default: DEFAULT.INDIEAUTH_CLIENT_LOGO_URI
    }),

    clientName: Type.Optional(client_name),

    clientUri: Type.Optional(client_uri),

    /**
     * Length for the code verifier to use when generating the PKCE code challenge.
     */
    codeVerifierLength: Type.Optional({
      ...code_verifier_length,
      default: DEFAULT.CODE_VERIFIER_LENGTH
    }),

    emailAuthStartPath: Type.Optional(
      Type.String({
        default: DEFAULT.EMAIL_AUTH_START_PATH,
        minLength: 1
      })
    ),

    emailAuthRedirectPath: Type.Optional(
      Type.String({
        default: DEFAULT.EMAIL_AUTH_REDIRECT_PATH,
        minLength: 1
      })
    ),

    githubAuthStartPath: Type.Optional(
      Type.String({
        default: DEFAULT.GITHUB_AUTH_START_PATH,
        minLength: 1
      })
    ),

    githubAuthRedirectPath: Type.Optional(
      Type.String({
        default: DEFAULT.GITHUB_AUTH_REDIRECT_PATH,
        minLength: 1
      })
    ),

    githubOAuthClientId: Type.Optional(
      Type.String({ default: DEFAULT.GITHUB_OAUTH_CLIENT_ID, minLength: 1 })
    ),

    githubOAuthClientSecret: Type.Optional(
      Type.String({ default: DEFAULT.GITHUB_OAUTH_CLIENT_SECRET, minLength: 1 })
    ),

    googleAuthStartPath: Type.Optional(
      Type.String({
        default: DEFAULT.GOOGLE_AUTH_START_PATH,
        minLength: 1
      })
    ),

    googleAuthRedirectPath: Type.Optional(
      Type.String({
        default: DEFAULT.GOOGLE_AUTH_REDIRECT_PATH,
        minLength: 1
      })
    ),

    googleOAuthClientId: Type.Optional(
      Type.String({
        default: DEFAULT.GOOGLE_OAUTH_CLIENT_ID,
        minLength: 1
      })
    ),

    googleOAuthClientSecret: Type.Optional(
      Type.String({
        default: DEFAULT.GOOGLE_OAUTH_CLIENT_SECRET,
        minLength: 1
      })
    ),

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    indieAuthStartPath: Type.Optional(
      Type.String({
        default: DEFAULT.INDIEAUTH_START_PATH,
        minLength: 1
      })
    ),

    indieAuthRedirectPath: Type.Optional(
      Type.String({
        default: DEFAULT.INDIEAUTH_REDIRECT_PATH,
        minLength: 1
      })
    ),

    /**
     * Introspection endpoint URL. If not provided, the one found in the OAuth
     * Client ID Metadata Document during
     * [Discovery](https://indieauth.spec.indieweb.org/#discovery) will be used.
     *
     * It's useful to set this option if you are developing a token
     * introspection endpoint.
     *
     * @see [OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662)
     */
    introspectionEndpoint: Type.Optional(introspection_endpoint),

    /**
     * Predicate function that will be called to check whether a previously
     * issued token is blacklisted or not.
     */
    isAccessTokenRevoked: isAccessTokenRevoked,

    /**
     * Issuer identifier. If not provided, the one found in the OAuth Client ID
     * Metadata Document during [Discovery](https://indieauth.spec.indieweb.org/#discovery)
     * will be used.
     *
     * It's useful to set this option if you are developing an authorization
     * endpoint.
     *
     * See also the `authorization_response_iss_parameter_supported` parameter in
     * [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata).
     */
    issuer: Type.Optional(issuer),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    micropubEndpoint: micropub_endpoint,

    redirectUris: redirect_uris,

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    /**
     * Revocation endpoint URL. If not provided, the one found in the OAuth
     * Client ID Metadata Document during
     * [Discovery](https://indieauth.spec.indieweb.org/#discovery) will be used.
     *
     * It's useful to set this option if you are developing a token revocation
     * endpoint.
     *
     * @see [Token Revocation - IndieAuth spec](https://indieauth.spec.indieweb.org/#x7-token-revocation)
     */
    revocationEndpoint: Type.Optional(revocation_endpoint),

    submitEndpoint: Type.String({
      format: 'uri',
      title: 'submit endpoint'
    }),

    /**
     * Token endpoint URL. If not provided, the one found in the OAuth Client ID
     * Metadata Document during
     * [Discovery](https://indieauth.spec.indieweb.org/#discovery) will be used.
     *
     * It's useful to set this option if you are developing a token endpoint.
     *
     * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
     */
    tokenEndpoint: Type.Optional(token_endpoint),

    userinfoEndpoint: Type.Optional(userinfo_endpoint)
  },
  {
    $id: 'fastify-micropub-client-options',
    description: 'Options for the Fastify micropub-client plugin',
    title: 'Fastify plugin micropub-client options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenRevoked: IsAccessTokenRevoked
}

// export const consent_get_request_querystring = Type.Object({
//   me: me_after_url_canonicalization
// })

// export type ConsentGetRequestQuerystring = Static<
//   typeof consent_get_request_querystring
// >

export const auth_start_get_request_querystring = Type.Object({
  client_id,
  me: Type.Union(
    [me_before_url_canonicalization, me_after_url_canonicalization],
    {
      description: `The 'me' value that the user typed in the login form for Web sign-in.`
    }
  )
})

export type AuthStartGetRequestQuerystring = Static<
  typeof auth_start_get_request_querystring
>
