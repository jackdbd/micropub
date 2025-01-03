import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  me_before_url_canonicalization,
  me_after_url_canonicalization
} from '../../lib/indieauth/index.js'
import {
  deleteContentOrMedia,
  isAccessTokenBlacklisted,
  type IsAccessTokenBlacklisted,
  report_all_ajv_errors,
  uploadMedia
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

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
    ajv: Type.Optional(Type.Any()),

    delete: deleteContentOrMedia,

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    isAccessTokenBlacklisted,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    me: Type.Union([
      me_before_url_canonicalization,
      me_after_url_canonicalization
    ]),

    multipartFormDataMaxFileSize: Type.Optional(
      Type.Number({
        title: 'multipart/form-data max file size',
        default: DEFAULT.MULTIPART_FORMDATA_MAX_FILE_SIZE,
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        minimum: 0
      })
    ),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    upload: uploadMedia
  },
  {
    $id: 'fastify-media-endpoint-options',
    title: 'Fastify plugin media-endpoint options',
    description: 'Options for the Fastify media-endpoint plugin'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
}
