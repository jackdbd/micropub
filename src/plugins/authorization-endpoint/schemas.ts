import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  retrieveAuthorizationCode,
  storeAuthorizationCode,
  type StoreAuthorizationCode,
  type RetrieveAuthorizationCode
} from '../../lib/authorization-code-storage-interface/index.js'
import {
  client_id,
  issuer,
  me_before_url_canonicalization,
  me_after_url_canonicalization
} from '../../lib/indieauth/index.js'
import {
  authorization_code,
  redirect_uri,
  response_type,
  scope,
  state
} from '../../lib/oauth2/index.js'
import {
  code_challenge,
  code_challenge_method,
  code_verifier
} from '../../lib/pkce/index.js'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    /**
     * AJV instance, for validation.
     */
    ajv: Type.Optional(Type.Any()),

    /**
     * Human-readable expiration time for the authorization code. It will be
     * shown in the consent screen.
     *
     * @example '60 seconds'
     */
    authorizationCodeExpiration: Type.String({
      default: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
      minLength: 1
    }),

    /**
     * Whether to include an `error_description` property in all error responses.
     */
    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
    }),

    /**
     * Issuer identifier. This is optional in OAuth 2.0 servers, but required in
     * IndieAuth servers.
     *
     * See also the `authorization_response_iss_parameter_supported` parameter in
     * [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata).
     */
    issuer: Type.Optional(issuer),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    /**
     * Whether to include all AJV errors when validation fails.
     */
    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    /**
     * Function that retrieves an authorization code from some storage.
     */
    retrieveAuthorizationCode,

    /**
     * Function that persists an authorization code to some storage (e.g. a
     * database).
     */
    storeAuthorizationCode
  },
  {
    $id: 'fastify-authorization-endpoint-options',
    description: 'Options for the Fastify authorization-endpoint plugin',
    title: 'Fastify plugin authorization-endpoint options'
  }
)

/**
 * Options for the Fastify authorization-endpoint plugin.
 */
export interface Options extends Static<typeof options> {
  ajv?: Ajv
  retrieveAuthorizationCode: RetrieveAuthorizationCode
  storeAuthorizationCode: StoreAuthorizationCode
}

/**
 * Query string of the Authorization Request.
 *
 * @see [Authorization Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)
 * @see [Authorization Request - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-request)
 */
export const authorization_request_querystring = Type.Object({
  client_id,

  code_challenge,

  code_challenge_method,

  /**
   * Profile URL.
   *
   * The IndieAuth client SHOULD provide the "me" query string parameter to the
   * authorization endpoint, either the exact value the user entered, or the
   * value after applying [URL Canonicalization](https://indieauth.spec.indieweb.org/#url-canonicalization).
   *
   * Either the string that the user entered, or the value after applying [URL
   * Canonicalization](https://indieauth.spec.indieweb.org/#url-canonicalization).
   */
  me: Type.Union([
    me_before_url_canonicalization,
    me_after_url_canonicalization
  ]),

  /**
   * The URL to which this authorization endpoint redirects the client after the
   * end user **approves** the authorization request.
   */
  redirect_uri,

  /**
   * The value MUST be one of "code" for requesting an authorization code.
   */
  response_type: { ...response_type, default: 'code' },

  scope: Type.Optional(scope),

  state
})

export type AuthorizationRequestQuerystring = Static<
  typeof authorization_request_querystring
>

/**
 * Access Token Request body.
 *
 * Once the client has obtained an authorization code, it can redeem it for an
 * access token.
 *
 * @see [Redeeming the Authorization Code - IndieAuth](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 * @see [Access Token Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3)
 */
export const access_token_request_body = Type.Object({
  client_id,
  code: authorization_code,
  code_verifier,
  grant_type: Type.Literal('authorization_code'),
  redirect_uri
})

export type AccessTokenRequestBody = Static<typeof access_token_request_body>

/**
 * Response body to a successful Authorization Request.
 *
 * If the user approves the request, the authorization endpoint generates an
 * authorization code and builds the redirect back to the client.
 *
 * @see [Authorization Response - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [Authorization Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
 */
export const authorization_response_body_success = Type.Object({
  me: me_after_url_canonicalization,
  scope: Type.Optional(scope)
})

export type AuthorizationResponseBodySuccess = Static<
  typeof authorization_response_body_success
>

export const profile_url_request_body = Type.Object({
  client_id,
  code: authorization_code,
  code_verifier,
  grant_type: Type.Optional(Type.Literal('profile_url')),
  redirect_uri
})

export type ProfileUrlRequestBody = Static<typeof profile_url_request_body>

export const profile_url_response_body_success = Type.Object({
  me: me_after_url_canonicalization
})

export type ProfileUrlResponseBodySuccess = Static<
  typeof profile_url_response_body_success
>

/**
 * Action that the resource owner can take in regards to an authorization
 * request.
 *
 * For example, the authorization endpoint may render a consent form containing
 * an "APPROVE" button and a "DENY" button, and the end user may click either
 * one of those buttons.
 */
const action = Type.Union([Type.Literal('approve'), Type.Literal('deny')])

export type Action = Static<typeof action>

/**
 * Query string built by the authorization endpoint.
 *
 * If the user approves the request, the authorization endpoint generates an
 * authorization code and builds the redirect back to the client.
 *
 * @see [Authorization Response - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [Authorization Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
 */
export const authorization_response_querystring = Type.Object(
  {
    /**
     * Authorization code generated by this authorization endpoint.
     */
    code: authorization_code,

    /**
     * Issuer identifier of this authorization endpoint.
     */
    iss: Type.Optional(issuer),

    /**
     * Parameter 'state' set by the client in the request. It MUST be set to the
     * exact value that the client set in the request.
     */
    state
  },
  {
    $id: 'authorization-response-querystring',
    description: `Query string built by the authorization endpoint. If the user approves the request, the authorization endpoint generates an authorization code and builds the redirect back to the client.`
  }
)

export type AuthorizationResponseQuerystring = Static<
  typeof authorization_response_querystring
>

export const handle_action_querystring = Type.Object({
  action,

  client_id,

  code_challenge,

  code_challenge_method,

  me: Type.Union([
    me_before_url_canonicalization,
    me_after_url_canonicalization
  ]),

  /**
   * The URL where the authorization server redirects the client after the user
   * **approves** the authorization request.
   */
  redirect_uri,

  /**
   * The URL where the authorization server redirects the client after the user
   * **denies** the authorization request.
   */
  redirect_uri_on_deny: redirect_uri,

  scope,

  state
})

export type HandleActionQuerystring = Static<typeof handle_action_querystring>
