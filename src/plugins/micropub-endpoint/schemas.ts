import { Static, Type } from '@sinclair/typebox'
import {
  h_card,
  h_cite,
  h_entry,
  h_event
} from '../../lib/microformats2/index.js'
import { DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE } from './constants.js'

export const plugin_options = Type.Object(
  {
    authorizationEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'authorization endpoint',
        description: `Micropub clients that want to post to a user's Micropub endpoint need to obtain authorization from the user in order to get an access token.`,
        default: 'https://indieauth.com/auth'
      })
    ),

    me: Type.String({
      format: 'uri',
      title: 'me',
      description: `URL of the user's website trying to authenticate using Web sign-in.`
    }),

    multipartFormDataMaxFileSize: Type.Optional(
      Type.Number({
        title: 'multipart/form-data max file size',
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        default: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
        minimum: 0
      })
    ),

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

export type MicropubEndpointPluginOptions = Static<typeof plugin_options>

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
