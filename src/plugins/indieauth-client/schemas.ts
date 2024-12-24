import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  isBlacklisted,
  type IsBlacklisted,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  client_id,
  client_name,
  client_uri,
  issuer,
  logo_uri,
  redirect_uris,
  userinfo_endpoint
} from '../../lib/indieauth/index.js'
import { micropub_endpoint } from '../../lib/micropub/index.js'
import {
  authorization_endpoint,
  introspection_endpoint,
  revocation_endpoint,
  token_endpoint
} from '../../lib/oauth2/index.js'
import { code_verifier_length } from '../../lib/pkce/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(Type.Any()),

    authenticationStartPath: Type.Optional(
      Type.String({ default: DEFAULT.AUTHENTICATION_START_PATH })
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

    clientId: client_id,

    clientName: client_name,

    clientUri: client_uri,

    /**
     * Length for the code verifier to use when generating the PKCE code challenge.
     */
    codeVerifierLength: Type.Optional({
      ...code_verifier_length,
      default: DEFAULT.CODE_VERIFIER_LENGTH
    }),

    githubAuthenticationStartPath: Type.Optional(
      Type.String({ default: DEFAULT.GITHUB_AUTHENTICATION_START_PATH })
    ),

    githubAuthenticationCallbackPath: Type.Optional(
      Type.String({ default: DEFAULT.GITHUB_AUTHENTICATION_CALLBACK_PATH })
    ),

    indieAuthAuthenticationStartPath: Type.Optional(
      Type.String({ default: DEFAULT.INDIEAUTH_AUTHENTICATION_START_PATH })
    ),

    indieAuthAuthenticationCallbackPath: Type.Optional(
      Type.String({ default: DEFAULT.INDIEAUTH_AUTHENTICATION_CALLBACK_PATH })
    ),

    introspectionEndpoint: introspection_endpoint,

    /**
     * Predicate function that will be called to check whether a previously
     * issued token is blacklisted or not.
     */
    isBlacklisted,

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

    logoUri: Type.Optional({ ...logo_uri, default: DEFAULT.LOGO_URI }),

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
    $id: 'fastify-indieauth-client-options',
    description: 'Options for the Fastify indieauth-client plugin',
    title: 'Fastify plugin indieauth-client options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isBlacklisted: IsBlacklisted
}
