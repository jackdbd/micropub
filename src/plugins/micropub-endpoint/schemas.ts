import { Static, Type } from '@sinclair/typebox'
import {
  h_card,
  h_cite,
  h_entry,
  h_event
} from '../../lib/microformats2/index.js'
import {
  DEFAULT_AUTHORIZATION_CALLBACK_ROUTE,
  DEFAULT_CODE_CHALLENGE_METHOD,
  DEFAULT_CODE_VERIFIER_LENGTH,
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

const service = Type.Object({
  name: Type.String(),
  url: Type.String(),
  photo: Type.Optional(Type.String())
})

const user = Type.Object({
  name: Type.String(),
  url: Type.String(),
  photo: Type.Optional(Type.String())
})

const syndicate_to_item = Type.Object({
  uid: Type.String(),
  name: Type.String(),
  service: Type.Optional(service),
  user: Type.Optional(user)
})

const store = Type.Object({
  create: Type.Any(),
  delete: Type.Optional(Type.Any()),
  get: Type.Any(),
  info: Type.Any(),
  jf2ToContent: Type.Any(),
  publishedUrlToStoreLocation: Type.Any(),
  undelete: Type.Optional(Type.Any()),
  update: Type.Any()
})

export const options = Type.Object(
  {
    authorizationEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'authorization endpoint',
        description: `Micropub clients that want to post to a user's Micropub endpoint need to obtain authorization from the user in order to get an access token.`,
        default: 'https://indieauth.com/auth'
      })
    ),

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

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT_INCLUDE_ERROR_DESCRIPTION })
    ),

    me: Type.String({
      format: 'uri',
      title: 'me',
      description: `URL of the user's website trying to authenticate using Web sign-in.`
    }),

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

    reportAllAjvErrors: Type.Optional(
      Type.Boolean({ default: DEFAULT_REPORT_ALL_AJV_ERRORS })
    ),

    store,

    submitEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'submit endpoint'
      })
    ),

    syndicateTo: Type.Optional(Type.Array(syndicate_to_item, { default: [] })),

    tokenEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'token endpoint',
        description: `Micropub clients will be able to obtain an access token from this endpoint after you have granted authorization. The Micropub client will then use this access token when making requests to your Micropub endpoint.`,
        default: 'https://tokens.indieauth.com/token'
      })
    )
  },
  {
    $id: 'fastify-micropub-endpoint-options',
    title: 'Fastify plugin micropub-endpoint options',
    description: 'Options for the Fastify micropub-endpoint plugin'
  }
)

export type Options = Static<typeof options>

export const micropub_get_request = Type.Object(
  { query: Type.Object({ q: Type.String() }) },
  {
    $id: 'micropub-get-request',
    title: 'micropub GET request',
    description: 'GET request hitting a micropub endpoint',
    additionalProperties: true
  }
)

export type MicropubGetRequest = Static<typeof micropub_get_request>

export const micropub_post_request = Type.Object(
  {
    body: Type.Union([
      Type.Ref(h_card),
      Type.Ref(h_cite),
      Type.Ref(h_entry),
      Type.Ref(h_event)
    ])
  },
  {
    $id: 'micropub-post-request',
    title: 'micropub POST request',
    description: 'POST request hitting a micropub endpoint',
    additionalProperties: true
  }
)

export type MicropubPostRequest = Static<typeof micropub_post_request>
