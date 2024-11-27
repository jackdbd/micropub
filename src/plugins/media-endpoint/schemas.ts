import { Static, Type } from '@sinclair/typebox'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

/**
 * Options for the Fastify media-endpoint plugin.
 *
 * @property includeErrorDescription
 * Whether to include error_description in error responses.
 * The Micropub server MAY include a human-readable description of the error in
 * the error_description property. This is meant to assist the Micropub client
 * developer in understanding the error. This is NOT meant to be shown to the
 * end user.
 * @see https://micropub.spec.indieweb.org/#error-response
 *
 * @property me
 * URL of the user's website trying to authenticate using Web sign-in.
 * @see https://indieweb.org/Web_sign-in
 *
 * @property multipartFormDataMaxFileSize
 * Max file size (in bytes) for multipart/form-data requests.
 *
 * @property reportAllAjvErrors
 * Whether to report all AJV validation errors.
 * @see https://ajv.js.org/security.html#security-risks-of-trusted-schemas
 *
 * @property store
 * Storage backend for the Micropub media endpoint.
 */
export const options = Type.Object(
  {
    includeErrorDescription: Type.Optional(
      Type.Boolean({
        title: 'include error_description',
        default: DEFAULT_INCLUDE_ERROR_DESCRIPTION,
        description: 'Whether to include error_description in error responses.'
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
        default: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        minimum: 0
      })
    ),

    reportAllAjvErrors: Type.Optional(
      Type.Boolean({
        title: 'report all AJV errors',
        default: DEFAULT_REPORT_ALL_AJV_ERRORS,
        description: 'Whether to report all AJV validation errors.'
      })
    ),

    store: Type.Object(
      {
        // upload: Type.Function(
        //   [
        //     Type.Object(
        //       { body: Type.Any(), contentType: Type.String() },
        //       { title: 'create config' }
        //     )
        //   ],
        //   Type.Promise(Type.Any()),
        //   {
        //     description:
        //       'create function. It will upload to the file to the storage backend.'
        //   }
        // ),
        delete: Type.Optional(Type.Any()),
        upload: Type.Any(),
        info: Type.Object({
          name: Type.String({
            title: 'Store name',
            description: 'Storage backend for the Micropub media endpoint.'
          }),
          public_root_url: Type.String({
            title: 'Public base URL',
            description:
              'The base URL at which your files will be publicly accessible.'
          })
        })
      },
      {
        $id: 'micropub-media-endpoint-store',
        title: 'Micropub media endpoint store',
        description: 'Storage backend for the Micropub media endpoint.',
        additionalProperties: true
      }
    )
  },
  {
    $id: 'fastify-media-endpoint-options',
    title: 'Fastify plugin media-endpoint options',
    description: 'Options for the Fastify media-endpoint plugin'
  }
)

export type Options = Static<typeof options>
