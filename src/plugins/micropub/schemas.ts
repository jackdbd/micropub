import { Static, Type } from '@sinclair/typebox'
import {
  h_card,
  h_cite,
  h_entry,
  h_event
} from '../../lib/microformats2/index.js'

export const plugin_options = Type.Object(
  {
    me: Type.String({
      format: 'uri',
      title: 'me',
      description: `URL of the user's website trying to authenticate using Web sign-in.`
    }),

    authorizationEndpoint: Type.Optional(
      Type.String({
        format: 'uri',
        title: 'authorization endpoint',
        description: `Micropub clients that want to post to a user's Micropub endpoint need to obtain authorization from the user in order to get an access token.`,
        default: 'https://indieauth.com/auth'
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
    $id: 'fastify-micropub-options',
    title: 'fastify-micropub options',
    description: 'Options for the fastify-micropub plugin'
  }
)

export type MicropubPluginOptions = Static<typeof plugin_options>

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
