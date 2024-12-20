import { Static, Type } from '@sinclair/typebox'
import {
  authorization_endpoint,
  token_endpoint
} from '../../lib/oauth2/index.js'
import {
  create,
  deleteContentOrMedia,
  isBlacklisted,
  me,
  report_all_ajv_errors,
  syndicate_to_item,
  undelete,
  update
} from '../../lib/schemas/index.js'
import type {
  Create,
  DeleteContentOrMedia,
  IsBlacklisted,
  Undelete,
  Update
} from '../../lib/schemas/index.js'
import {
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_AUTHORIZATION_ENDPOINT,
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  DEFAULT_TOKEN_ENDPOINT
} from './constants.js'

export const options = Type.Object(
  {
    authorizationEndpoint: Type.Optional({
      ...authorization_endpoint,
      default: DEFAULT_AUTHORIZATION_ENDPOINT,
      description: `Micropub clients that want to post to a user's Micropub endpoint need to obtain authorization from the user in order to get an access token.`
    }),

    authorizationCallbackRoute: Type.Optional(
      Type.String({ default: DEFAULT_AUTHORIZATION_CALLBACK_ROUTE })
    ),

    baseUrl: Type.String(),

    clientId: Type.String(),

    codeChallengeMethod: Type.Optional(
      Type.String({ default: DEFAULT_CODE_CHALLENGE_METHOD })
    ),

    codeVerifierLength: Type.Optional(
      Type.Number({ default: DEFAULT_CODE_VERIFIER_LENGTH })
    ),

    create,

    delete: deleteContentOrMedia,

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT_INCLUDE_ERROR_DESCRIPTION })
    ),

    isBlacklisted,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    me,

    mediaEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'media endpoint'
      })
    ),

    micropubEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'micropub endpoint'
      })
    ),

    multipartFormDataMaxFileSize: Type.Optional(
      Type.Number({
        title: 'multipart/form-data max file size',
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        default: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
        minimum: 0
      })
    ),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    }),

    submitEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'submit endpoint'
      })
    ),

    syndicateTo: Type.Optional(Type.Array(syndicate_to_item, { default: [] })),

    tokenEndpoint: Type.Optional({
      ...token_endpoint,
      description: `Micropub clients will be able to obtain an access token from this endpoint after you have granted authorization. The Micropub client will then use this access token when making requests to your Micropub endpoint.`,
      default: DEFAULT_TOKEN_ENDPOINT
    }),

    undelete: Type.Optional(undelete),

    update
  },
  {
    $id: 'fastify-micropub-endpoint-options',
    title: 'Fastify plugin micropub-endpoint options',
    description: 'Options for the Fastify micropub-endpoint plugin'
  }
)

export interface Options extends Static<typeof options> {
  create: Create
  delete: DeleteContentOrMedia
  isBlacklisted: IsBlacklisted
  undelete?: Undelete
  update: Update
}
