import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  authorization_endpoint,
  revocation_endpoint,
  token_endpoint
} from '../../lib/oauth2/index.js'
import {
  client_id,
  client_name,
  client_uri,
  issuer,
  logo_uri,
  redirect_uris
} from '../../lib/indieauth/index.js'
import { code_verifier_length } from '../../lib/pkce/index.js'
import {
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_AUTHORIZATION_START_ROUTE,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_LOGO_URI,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object(
  {
    authorizationCallbackRoute: Type.Optional(
      Type.String({ default: DEFAULT_AUTHORIZATION_CALLBACK_ROUTE })
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

    authorizationStartRoute: Type.Optional(
      Type.String({ default: DEFAULT_AUTHORIZATION_START_ROUTE })
    ),

    clientId: client_id,

    clientName: client_name,

    clientUri: client_uri,

    /**
     * Length for the code verifier to use when generating the PKCE code challenge.
     */
    codeVerifierLength: Type.Optional({
      ...code_verifier_length,
      default: DEFAULT_CODE_VERIFIER_LENGTH
    }),

    includeErrorDescription: Type.Optional({
      ...include_error_description,
      default: DEFAULT_INCLUDE_ERROR_DESCRIPTION
    }),

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

    logoUri: Type.Optional({ ...logo_uri, default: DEFAULT_LOGO_URI }),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    redirectUris: redirect_uris,

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
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

    /**
     * Token endpoint URL. If not provided, the one found in the OAuth Client ID
     * Metadata Document during
     * [Discovery](https://indieauth.spec.indieweb.org/#discovery) will be used.
     *
     * It's useful to set this option if you are developing a token endpoint.
     *
     * @see [Redeeming the Authorization Code - IndieAuth spec](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
     */
    tokenEndpoint: Type.Optional(token_endpoint)
  },
  {
    $id: 'fastify-indieauth-client-options',
    description: 'Options for the Fastify indieauth-client plugin',
    title: 'Fastify plugin indieauth-client options'
  }
)

export type Options = Static<typeof options>
