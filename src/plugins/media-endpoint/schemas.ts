import { Static, Type } from '@sinclair/typebox'
import { DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE } from './constants.js'

export const plugin_options = Type.Object(
  {
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
    )
  },
  {
    $id: 'fastify-media-endpoint-options',
    title: 'Fastify plugin media-endpoint options',
    description: 'Options for the Fastify media-endpoint plugin'
  }
)

export type MediaEndpointPluginOptions = Static<typeof plugin_options>
