import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../lib/schemas/index.js'
import {
  client_id,
  client_name,
  client_uri,
  logo_uri,
  redirect_uris
} from '../../lib/indieauth/index.js'
import {
  authorization_endpoint,
  revocation_endpoint
} from '../../lib/oauth2/index.js'
import { code_verifier_length } from '../../lib/pkce/index.js'
import {
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_LOGO_URI,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object(
  {
    authorizationEndpoint: Type.Optional({
      ...authorization_endpoint,
      default: DEFAULT_AUTHORIZATION_ENDPOINT
    }),

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

    logoUri: Type.Optional({ ...logo_uri, default: DEFAULT_LOGO_URI }),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    redirectUris: redirect_uris,

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    }),

    revocationEndpoint: Type.Optional(revocation_endpoint)
  },
  {
    $id: 'fastify-indieauth-client-options',
    description: 'Options for the Fastify indieauth-client plugin',
    title: 'Fastify plugin indieauth-client options'
  }
)

export type Options = Static<typeof options>
